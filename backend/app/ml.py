"""Optional ML second opinion: TF-IDF + logistic regression trained at start-up on a small synthetic corpus.

It never changes the explainable risk score.
"""
from __future__ import annotations

import functools
import math
from app.config import load_scenarios

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    import numpy as np
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


@functools.lru_cache(maxsize=1)
def get_model():
    if not SKLEARN_AVAILABLE:
        return None, None

    book = load_scenarios()
    scenarios = book.get('scenarios', [])

    scam_docs = [s['message'] for s in scenarios if s.get('kind') == 'scam' and s.get('message')]
    legit_docs = [s['message'] for s in scenarios if s.get('kind') == 'legit' and s.get('message')]

    # 25 scam-like messages
    scam_docs.extend([
        "Dear customer, your electricity will be disconnected tonight at 9 PM. Pay previous due 540 to xyz@demo.",
        "Your KYC is expiring in 24 hours. Your account will be blocked. Click here to verify now.",
        "Parcel held at customs. Unpaid delivery fee of 45. Send to xyz@demo to release.",
        "Congratulations! You won the grand prize of 10000. Send a small processing fee of 500 to xyz@demo.",
        "Refund processed for 3000. Scan this QR code and enter PIN to receive money in your account.",
        "Part-time job offer: earn 5000 a day from home. Pay 150 to xyz@demo for registration.",
        "Huge returns! Invest 1000 today and get 5000 tomorrow. Send funds to xyz@demo.",
        "Customer care: we need you to download this app and approve a 10 payment to xyz@demo to cancel your order.",
        "Scan to receive money immediately to your bank account.",
        "Urgent: your credit card is blocked. Call our support or send a 5 test transaction to xyz@demo.",
        "Electricity disconnection notice: update your bill within 2 hours or face blackout. Pay to xyz@demo.",
        "Your fastag is blacklisted! Recharge immediately via xyz@demo to avoid toll fines.",
        "Amazon gift card won! Claim it by sending a 20 validation fee to xyz@demo.",
        "Income tax refund of 4500 is pending. Please verify your account by transferring 10 to xyz@demo.",
        "Dear user, your phone number has won the lottery. Send 100 to xyz@demo for taxes.",
        "Your Netflix subscription has expired. Renew instantly by paying 99 to xyz@demo.",
        "Urgent: we detected suspicious activity. Send all your funds to the secure wallet xyz@demo.",
        "Earn easily by liking YouTube videos. Deposit 500 to xyz@demo to join the VIP tier.",
        "You have a package waiting. Pay shipping fee 20 to xyz@demo to track it.",
        "Government scheme bonus approved. Scan the QR and pay 50 to xyz@demo as processing charge.",
        "Your PAN card is invalid. Rectify now by paying a penalty of 100 to xyz@demo.",
        "Dear sir/madam, your loan for 50000 is approved. Pay 999 to xyz@demo for stamp duty.",
        "We are from technical support. Your PC is infected. Buy antivirus for 500 at xyz@demo.",
        "Verify your UPI ID to receive 500 cashback. Send a 1 ping to xyz@demo.",
        "Account suspended! Reactivate by paying 10 to xyz@demo immediately.",
        "Your insurance policy has lapsed. Pay the premium of 5000 to xyz@demo today to reinstate.",
    ])

    # 30 benign-like messages
    legit_docs.extend([
        "Your monthly electricity bill of 1500 is generated and due on 15th. Please pay by the due date.",
        "Hey, thanks for dinner. Sending my share for the pizza, 300.",
        "Payment received for order #12345. Thank you for shopping with us.",
        "Your package is out for delivery today and will arrive between 2 PM and 5 PM.",
        "Dear employee, your salary of 50000 has been credited to your account.",
        "Here is the rent for this month, 15000.",
        "Grocery bill for today: 450.",
        "Movie tickets booked! See you at 6 PM. Sending you 250 for my ticket.",
        "Your internet connection recharge of 999 was successful.",
        "Water bill generated for the month. Amount: 150.",
        "Happy birthday! Sending a small gift of 500.",
        "Flight tickets confirmed. PNR: ABCDEF.",
        "Your order from Swiggy is arriving in 15 minutes.",
        "Gym membership renewed for the next 3 months, 3000 paid.",
        "Payment of 2500 made to the plumber.",
        "Refund of 200 for cancelled item has been processed to your original payment method.",
        "Your mobile postpaid bill is 499, due by 10th.",
        "Thanks for the coffee, here is 150.",
        "Cab fare for the trip to the airport: 800.",
        "School fees for the upcoming quarter: 12000.",
        "Your car insurance premium of 8500 is due next month.",
        "Medicines purchased today: 650.",
        "Here is 500 for the books I borrowed.",
        "Contribution for the office farewell party: 300.",
        "Your EMI of 5000 has been deducted successfully.",
        "Paid 400 for the haircut.",
        "Train tickets booked successfully. Journey date: 25th.",
        "Dry cleaning bill: 250.",
        "Gas cylinder booking confirmed. Refill cost 850.",
        "Thanks for picking up the groceries, sending you the 700 I owe you.",
        "Monthly maintenance charges: 1200.",
    ])

    docs = scam_docs + legit_docs
    y = [1] * len(scam_docs) + [0] * len(legit_docs)

    vectorizer = TfidfVectorizer(ngram_range=(1, 2), lowercase=True, sublinear_tf=True)
    X = vectorizer.fit_transform(docs)

    model = LogisticRegression(max_iter=1000, random_state=0, class_weight='balanced')
    model.fit(X, y)

    return vectorizer, model


def ml_status() -> dict:
    if not SKLEARN_AVAILABLE:
        return {'available': False, 'model': None}
    try:
        vec, model = get_model()
        if vec and model:
            return {'available': True, 'model': 'tfidf-logreg-v1'}
    except Exception:
        pass
    return {'available': False, 'model': None}


def ml_insight(text: str) -> dict | None:
    if not text or not str(text).strip():
        return None

    if not SKLEARN_AVAILABLE:
        return None

    try:
        vec, model = get_model()
        if not vec or not model:
            return None
    except Exception:
        return None

    X_test = vec.transform([str(text)])

    prob = float(model.predict_proba(X_test)[0, 1])
    scam_prob = math.floor(prob * 1000 + 0.5) / 1000

    label = 'scam-like' if scam_prob >= 0.5 else 'benign-like'

    feature_names = vec.get_feature_names_out()
    tfidf_scores = X_test.toarray()[0]
    coefficients = model.coef_[0]

    contributions = tfidf_scores * coefficients
    important_indices = np.where(tfidf_scores > 0)[0]
    term_contributions = [(feature_names[i], float(contributions[i])) for i in important_indices if contributions[i] > 0]
    term_contributions.sort(key=lambda x: x[1], reverse=True)

    top_terms = [{'term': term, 'weight': math.floor(weight * 1000 + 0.5) / 1000} for term, weight in term_contributions[:5]]

    return {
        'available': True,
        'model': 'tfidf-logreg-v1',
        'scamProbability': scam_prob,
        'label': label,
        'topTerms': top_terms,
        'note': 'ML second opinion from a small synthetic demo corpus. It never changes the explainable risk score.'
    }
