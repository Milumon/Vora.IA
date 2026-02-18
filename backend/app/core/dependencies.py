from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.services.supabase_client import get_supabase_client

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase = Depends(get_supabase_client)
) -> dict:
    """Get current authenticated user from Supabase JWT token."""
    token = credentials.credentials
    
    try:
        # Verify token with Supabase
        response = supabase.auth.get_user(token)
        
        # Check if user exists in response
        if not response or not hasattr(response, 'user') or not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = response.user
        return {
            "id": user.id,
            "email": user.email,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error verifying token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_active_user(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """Get current active user (can add additional checks here)."""
    return current_user
