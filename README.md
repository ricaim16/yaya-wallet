# YaYa Wallet Webhook Integration (Node.js)

This project provides a reference implementation of a **secure webhook endpoint** for receiving transaction events from **YaYa Wallet**.  

The solution is implemented in **Node.js with Express** and demonstrates how to:  
- Receive and validate webhook payloads  
- Verify signatures using **HMAC-SHA256**  
- Protect against **replay attacks**  
- Enforce **IP whitelisting**  
- Return quick responses to avoid timeouts  


## 📌 Key Features

- **Webhook Endpoint** (`/webhook`)  
  Receives and validates transaction event notifications.  

- **Signature Verification**  
  Uses `YAYA-SIGNATURE` header and HMAC-SHA256 with a shared secret key.  

- **Replay Attack Prevention**  
  Rejects requests older than 5 minutes (based on payload `timestamp`).  

- **IP Address Verification**  
  Accepts requests only from trusted YaYa Wallet IPs.  

- **Testing Utility** (`/generate-signature`)  
  Endpoint for generating signatures during local testing.  

- **Robust Error Handling**  
  Clear error responses for missing fields, invalid signatures, expired timestamps, or unauthorized IPs.  


## 📂 Project Structure

├── index.js # Main server logic (Express app)

├── .env # Environment variables (secret key, port)

├── package.json # Dependencies and scripts

└── README.md # Project documentation







## ⚙️ Setup & Installation

### 1. Clone the Repository
```bash

git clone <your-repo-url>
cd yaya-wallet



Install Dependencies
npm install


3. Configure Environment Variables

Create a .env file in the project root:


SECRET_KEY=test_key
# Replace with your YaYa Wallet secret key


PORT=5000
 # Server port



4. Start the Server

npm start


Server will run at:

http://localhost:5000



🧪 Testing the Implementation

1. Generate a Signature (Local Testing)

Use the /generate-signature endpoint to generate a valid signature:

curl -X POST http://localhost:5000/generate-signature \
-H "Content-Type: application/json" \
-d '{
  "id": "123",
  "amount": 100,
  "currency": "ETB",
  "created_at_time": 1673381836,
  "timestamp": 1701272333,
  "cause": "Testing",
  "full_name": "Abebe Kebede",
  "account_name": "abebekebede1",
  "invoice_url": "https://yayawallet.com/en/invoice/xxxx"
}'


Response:

{ "signature": "<calculated_signature>" }


2. Send a Webhook Event

Call /webhook with the payload and generated signature:

curl -X POST http://localhost:5000/webhook \
-H "Content-Type: application/json" \
-H "yaya-signature: <calculated_signature>" \
-d '{
  "id": "123",
  "amount": 100,
  "currency": "ETB",
  "created_at_time": 1673381836,
  "timestamp": 1701272333,
  "cause": "Testing",
  "full_name": "Abebe Kebede",
  "account_name": "abebekebede1",
  "invoice_url": "https://yayawallet.com/en/invoice/xxxx"
}'


Response:

Webhook received successfully



🛑 Example Error Cases
Invalid Signature
curl -X POST http://localhost:5000/webhook \
-H "Content-Type: application/json" \
-H "yaya-signature: invalid_signature" \
-d '{ ... }'


Response:

Invalid signature

Replay Attack (Expired Timestamp)



If the payload timestamp is older than 5 minutes:

Request too old (replay attack prevention)


