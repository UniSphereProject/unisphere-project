from fastapi import FastAPI, APIRouter, status, Depends, HTTPException

from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.posts import Post
from app.models.post_interaction import PostReaction, PostComment, CommentReaction
from app.models.user import User
from app.utils.oauth2 import get_current_user
from app.schemas.post_interaction import Reaction, CommentResponse, CommentCreate

router = APIRouter(
    prefix="/interact",
    tags=['Post Interaction']
)



@router.post("/{post_id}/react")
def react_to_post(
    post_id: int,
    request: Reaction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post_entry = db.query(Post).filter(
        Post.id == post_id,
    ).first()

    if not post_entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=" Post Not found")

    # check existing reaction
    existing = db.query(PostReaction).filter(
        PostReaction.post_id == post_id,
        PostReaction.user_id == current_user.id,
    )
    existing_reaction=existing.first()

    if existing_reaction:
        if existing_reaction.reaction == request.reaction:
           # raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail=f"It is already reacted as {existing.reaction.value}.")
            print("Hello")
            existing.delete(synchronize_session=False)
            db.commit()
            return {"Message":f"Reaction {request.reaction.value} Removed"}
        else:
            existing_reaction.reaction = request.reaction
            db.commit()
            return {"message": f"Reaction changed to {request.reaction.value}"}
    else:
        # new reaction
        new_reaction = PostReaction(
            post_id=post_id,
            user_id=current_user.id,
            reaction=request.reaction.value,
        )
        db.add(new_reaction)
        db.commit()
        return {"message": f"Reaction {request.reaction.value} added."}



@router.post("/{post_id}/comment",response_model=CommentResponse)
def add_comment(
    post_id: int,
    content: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post_entry = db.query(Post).filter(
        Post.id == post_id,
    ).first()

    if not post_entry:
        raise HTTPException(404, "Not found")
    if content.parent_id:
        parent_comment = db.query(PostComment).filter(
            PostComment.id == content.parent_id
        ).first()

        # Does this parent comment even exist?
        if not parent_comment:
            raise HTTPException(404, "Parent comment not found")

        # Does it belong to the SAME post you're replying under?
        if parent_comment.post_id != post_id:
            raise HTTPException(400, "Parent comment belongs to a different post")
    comment = PostComment(
        post_id=post_id,
        user_id=current_user.id,
        content=content.content,
        is_anonymous=content.is_anonymous,
        parent_id=content.parent_id,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return CommentResponse.from_orm_masked(comment)

#Comment React

@router.post("/{comment_id}/react")
def react_to_comment(
    comment_id: int,
    request: Reaction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment_entry = db.query(PostComment).filter(
        PostComment.id == comment_id,
    ).first()

    if not comment_entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=" Comment Not found")

    # check existing reaction
    existing = db.query(CommentReaction).filter(
        CommentReaction.comment_id == comment_id,
        CommentReaction.user_id == current_user.id,
    )
    existing_reaction=existing.first()

    if existing_reaction:
        if existing_reaction.reaction == request.reaction:
           # raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail=f"It is already reacted as {existing.reaction.value}.")
            print("Hello")
            existing.delete(synchronize_session=False)
            db.commit()
            return {"Message":f"Reaction {request.reaction.value} Removed"}
        else:
            existing_reaction.reaction = request.reaction
            db.commit()
            return {"message": f"Reaction changed to {request.reaction.value}"}
    else:
        # new reaction
        new_reaction = CommentReaction(
            comment_id=comment_id,
            user_id=current_user.id,
            reaction=request.reaction.value,
        )
        db.add(new_reaction)
        db.commit()
        return {"message": f"Reaction {request.reaction.value} added."}
@router.post("/{comment_id}/reply", response_model=CommentResponse)
def reply_to_comment(
    comment_id: int,
    content: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    parent_comment = db.query(PostComment).filter(
        PostComment.id == comment_id
    ).first()

    if not parent_comment:
        raise HTTPException(404, "Comment not found")

    reply = PostComment(
        post_id=parent_comment.post_id,
        user_id=current_user.id,
        content=content.content,
        is_anonymous=content.is_anonymous,
        parent_id=comment_id,
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)
    return CommentResponse.from_orm_masked(reply)

