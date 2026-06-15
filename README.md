# Discussion Forum Backend

## Environment Variables (.env)

```
DATABASE_HOST=localhost
DATABASE_USER=your_database_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=your_db_name
JWT_SECRET_KEY=your_secret_key
JWT_ALGORITHM=HS256
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_brevo_gmail
BREVO_SENDER_NAME=Sender Alex
MODERATOR_EMAIL=moderator@gmail.com
MODERATOR_PASSWORD=moderator@Pass

```

## Start Project

```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

