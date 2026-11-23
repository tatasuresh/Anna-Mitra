
## Testing it yourself

Open https://anna-mitra-production.up.railway.app. On the home page, click a role card, then **Enter demo**. No password is needed. To sign in with email instead, use `donor@example.com`, `ngo@example.com`, `volunteer@example.com`, `admin@example.com` or `csr.sponsor@example.com`. The password is `DEMO_PASSWORD`

1. **Donor → Quick Post.**
   - Type a food description, a number of portions, and a pickup-by time in the future, then click Save values.
   - In the Handling checklist, answer when it was cooked, pick a storage option and allergens, tick the confirmation box and Save checklist.
   - Click Publish donation.
   - Watch it under Tracking, and try "Repeat last donation" from the dashboard.
2. **NGO → NGO Feed.**
   - Find your donation (nearest pickup-by first) and click Claim.
   - Enter the portions, then confirm within the 5-minute window (the timeout is shown on the page).
3. **Volunteer → Volunteer Tasks.**
   - Make sure "Available for pickups" is ticked.
   - Accept the pickup, then open Active Delivery, confirm collection, then confirm handover.
4. **NGO → NGO Receipt.** Enter the portions you actually received.
5. **Sponsor → Sponsor Impact.** The confirmed portions and kg should go up only now, not at publish or claim.
6. **Admin → Settings.**
   - Change kg per portion (say 0.5), then recheck Sponsor Impact. The estimate should change, and the page should show the new assumption.
   - Change it back to 0.35.
7. **Admin → Restaurants.** "Coral Table Kitchen" is pending approval, and its donations should not appear in the NGO feed. Approve it and they should appear.
8. **Quick extras:**
   - Wrong password on `/login` is rejected.
   - A donation with a pickup-by time a few minutes ahead should show as Expired under Tracking once that time passes, if nobody claimed it.
   - `/anything-wrong` shows "Page not found".

If you add test donations by hand, give them descriptions that don't start with "E2E". The startup cleanup deletes those on the next deploy.