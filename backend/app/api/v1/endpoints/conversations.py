from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from datetime import datetime

from app.core.dependencies import get_current_active_user
from app.services.supabase_client import get_supabase
from app.api.v1.schemas.conversation import (
    ConversationResponse,
    ConversationCreate,
    AddMessageRequest,
    ConversationWithItinerary,
)
from app.config.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("/active", response_model=Optional[ConversationWithItinerary])
async def get_active_conversation(
    current_user: dict = Depends(get_current_active_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Get user's active conversation with latest itinerary.
    Returns null if no active conversation exists.
    """
    try:
        # Use the helper function from migration
        response = supabase.rpc(
            'get_active_conversation',
            {'p_user_id': current_user['id']}
        ).execute()
        
        if not response.data or len(response.data) == 0:
            return None
            
        return response.data[0]
        
    except Exception as e:
        logger.error(f"Error fetching active conversation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch active conversation"
        )


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conversation: ConversationCreate,
    current_user: dict = Depends(get_current_active_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Create a new conversation.
    Automatically deactivates any existing active conversation.
    """
    try:
        # First, deactivate any existing active conversations
        supabase.table("conversations")\
            .update({"is_active": False})\
            .eq("user_id", current_user["id"])\
            .eq("is_active", True)\
            .execute()
        
        # Create new conversation
        data = {
            "user_id": current_user["id"],
            "messages": [msg.model_dump() for msg in conversation.messages],
            "state": conversation.state,
            "is_active": True,
            "last_message_at": datetime.utcnow().isoformat(),
        }
        
        response = supabase.table("conversations").insert(data).execute()
        
        if not response.data:
            raise ValueError("Supabase insert returned no data")
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating conversation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create conversation: {str(e)}"
        )


@router.patch("/{conversation_id}/messages", response_model=ConversationResponse)
async def add_message_to_conversation(
    conversation_id: str,
    request: AddMessageRequest,
    current_user: dict = Depends(get_current_active_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Add a message to an existing conversation.
    Updates last_message_at automatically via trigger.
    """
    try:
        # First, get the current conversation
        conv_response = supabase.table("conversations")\
            .select("*")\
            .eq("id", conversation_id)\
            .eq("user_id", current_user["id"])\
            .single()\
            .execute()
        
        if not conv_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        current_messages = conv_response.data.get("messages", [])
        
        # Append new message
        new_message = request.message.model_dump()
        updated_messages = current_messages + [new_message]
        
        # Update conversation
        update_response = supabase.table("conversations")\
            .update({
                "messages": updated_messages,
                "last_message_at": datetime.utcnow().isoformat(),
            })\
            .eq("id", conversation_id)\
            .eq("user_id", current_user["id"])\
            .execute()
        
        if not update_response.data:
            raise ValueError("Failed to update conversation")
        
        return update_response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding message to conversation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add message: {str(e)}"
        )


@router.patch("/{conversation_id}/deactivate", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_active_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Deactivate a conversation (mark as inactive).
    Used when starting a new conversation.
    """
    try:
        supabase.table("conversations")\
            .update({"is_active": False})\
            .eq("id", conversation_id)\
            .eq("user_id", current_user["id"])\
            .execute()
        
        return None
        
    except Exception as e:
        logger.error(f"Error deactivating conversation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate conversation"
        )


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_active_user),
    supabase: Client = Depends(get_supabase)
):
    """Get a specific conversation by ID."""
    try:
        response = supabase.table("conversations")\
            .select("*")\
            .eq("id", conversation_id)\
            .eq("user_id", current_user["id"])\
            .single()\
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        return response.data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching conversation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch conversation"
        )
