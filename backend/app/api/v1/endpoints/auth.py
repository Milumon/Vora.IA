from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.api.v1.schemas.user import UserLogin, UserRegister, UserResponse, TokenResponse
from app.services.supabase_client import get_supabase
from app.config.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    supabase: Client = Depends(get_supabase)
):
    """Register a new user."""
    try:
        response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "full_name": user_data.full_name
                }
            }
        })
        
        if response.user is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed"
            )
        
        return UserResponse(
            id=response.user.id,
            email=response.user.email,
            full_name=user_data.full_name
        )
    
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    supabase: Client = Depends(get_supabase)
):
    """Login user and return access token."""
    try:
        response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        if response.session is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        return TokenResponse(
            access_token=response.session.access_token,
            token_type="bearer",
            expires_in=response.session.expires_in
        )
    
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )


@router.post("/logout")
async def logout(supabase: Client = Depends(get_supabase)):
    """Logout current user."""
    try:
        supabase.auth.sign_out()
        return {"message": "Successfully logged out"}
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
