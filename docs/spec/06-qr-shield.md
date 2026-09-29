====================================================
6. QR SHIELD
====================================================

Build a fully functional simulated QR scanner.

Use device camera when available.

Also provide:
[UPLOAD QR IMAGE]
[USE DEMO QR]

IMPORTANT:
The QR scanner must NEVER trigger an actual payment.

Create demo QR scenarios:

QR001:
Utility Scam

QR002:
Legitimate Utility Payment

QR003:
Fake KYC

QR004:
Fake Shopping

QR005:
Fake Customer Care

QR006:
Prize/Reward Scam

QR007:
Job Scam

QR008:
Investment Scam

QR009:
Refund Scam

Each demo QR should contain safe simulation metadata.

Example:

PAYRAKSHA://demo-payment
recipient=unknown@demo
amount=1999
merchant=Electricity Demo
scenario=utility_scam

When scanned:

STEP 1:
“QR DETECTED”

STEP 2:
“Extracting payment metadata...”

STEP 3:
“Checking recipient...”

STEP 4:
“Checking payment context...”

STEP 5:
“Running risk engine...”

Animate each step.

Then show:

PAYMENT PREVIEW

Recipient:
unknown@demo

Merchant:
Electricity Board — DEMO

Amount:
₹1,999

Source:
WhatsApp — DEMO

Previous interaction:
None
