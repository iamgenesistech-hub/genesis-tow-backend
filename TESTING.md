Step-by-Step Testing Process for Genesis Tow
PHASE 1: PRE-TESTING SETUP
Step 1: Verify Deployments Are Online
Go to your Railway Dashboard
URL: https://railway.com/project/9da1a330-8e9e-4715-973d-8e4de89bb247
Check all 3 services show "Online" with green checkmarks:
✅ genesis-tow-frontend
✅ genesis-tow-backend
✅ Postgres
If any are red/offline, click the service and check build logs
Step 2: Check Twilio Credentials (Optional)
If you added Twilio credentials:
Go to genesis-tow-backend → Variables
Verify TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER are set
ℹ️ If not set, SMS will log to console instead (app still works)
Step 3: Add OpenCage API Key
Go to genesis-tow-backend → Variables
Verify OPENCAGE_API_KEY is set
If missing:
Go to https://opencagedata.com/
Sign up (free tier = 250 requests/day)
Copy your API key
Add it to Railway variables
Restart the backend service
PHASE 2: FRONTEND TESTING
Step 4: Open the Frontend
Go to: https://genesis-tow-frontend-production.up.railway.app
You should see the Genesis Tow home page
Check page loads completely (no 404s or blank sections)
Step 5: Test Photo Capture
Scroll to "Vehicle Photos" section
Try clicking a photo box (e.g., "Front of Vehicle")
Expected: Camera opens in full-screen with:
✅ Live video feed
✅ "Capture Photo" button
✅ "Cancel" button
Click "Capture Photo"
Expected: Photo appears in the box with green checkmark ✓
Test all 6 angles:

 Front
 Rear
 Front Driver Side
 Rear Driver Side
 Front Passenger Side
 Rear Passenger Side
Step 6: Test Service Type Selection
Click "Tow" button
Expected: Button turns blue, no subtype options appear
Click "Roadside Assistance"
Expected: Button turns blue, 2 subtype buttons appear:
"Tire Change"
"Lockout"
Click "Tire Change"
Expected: Button turns green
Click "Winch Out"
Expected: Button turns blue, no subtype options
Step 7: Test Vehicle Size Selection
Open the "Vehicle Size" dropdown
Expected: 3 options visible:
Regular (Cars & Most Pickups)
Medium (Duallys, Work Vans, Large Cars)
Heavy-Duty (18-Wheelers, Box Trucks)
Select "Medium"
Expected: Dropdown shows "Medium" selected
Step 8: Test Insurance Selection
Find "Optional Insurance" section (yellow box)
Click "No Insurance"
Expected: Button turns red
Click "Add Insurance (+$12)"
Expected: Button turns green, shows +$12 text
Read disclaimer text
Expected: Text mentions damage coverage & direct tow company contact
Step 9: Test Contact Info
Enter Name: John Smith
Enter Primary Phone: (404) 555-0123
Enter Secondary Phone (optional): (404) 555-0124
Expected: All fields accept input
Step 10: Test Vehicle Status
Click "Yes, I'm with it"
Expected: Button turns green
Click "Will you stay?" → "Yes, I'll stay"
Expected: Both buttons turn green
Purple "📍 Your Live Location" section appears
Click "📍 Get My Location"
Expected:
✅ Latitude/Longitude appear (or browser asks for location permission)
✅ Accuracy in meters shows
✅ Green checkmark appears
Step 11: Test Address Entry
Enter Pickup: 123 Main St, Atlanta, GA
Enter Dropoff: 456 Oak Ave, Atlanta, GA
Expected: Both fields accept input
Step 12: Test Quote Calculation
Scroll to "Calculate Quote & Get Driver" button
Expected: Button should be enabled (blue) if:
✅ All 6 photos uploaded
✅ Name & phone entered
✅ Vehicle status selected
✅ Addresses entered
Click "Calculate Quote & Get Driver"
Expected:
✅ Loading spinner appears
✅ Quote section appears below with:
Service Type shown
Vehicle Size shown
Distance in miles
📍 Coordinates shown
Base price + Insurance fee broken down
Total Estimated Price shown
PHASE 3: BOOKING & DRIVER TRACKING
Step 13: Confirm Booking
Click "✓ Confirm & Book Driver"
Expected:
✅ Loading state
✅ Page transitions to "Your Driver is On the Way"
✅ Driver card appears with:
Driver photo
Driver name
Company name "Genesis Tow Services"
ETA (12 minutes)
Status
Step 14: Test Driver Communication
Click "📞 Call Driver"
Expected: Phone app opens with driver's number (or browser shows dial dialog)
Go back to the app
Click "💬 Text Driver"
Expected: SMS/Messages app opens with driver's number
Step 15: Test Service Details
Scroll down on driver tracking page
Expected: "Service Details" section shows:
Distance
Price breakdown
Insurance fee (if selected)
Total
Pickup location
Dropoff location
PHASE 4: POST-SERVICE TESTING
Step 16: Rate Service
After driver tracking page, page should transition to rating screen
Or manually navigate to see rating flow
Expected: "How was your service?" prompt appears
Click on 4 stars
Expected: 4 stars light up in yellow
Click "$10" tip button
Expected: "$10" button turns green
Or enter custom tip: $15.50
Click "Submit Rating & Tip"
Expected:
✅ Loading state
✅ Completion message appears: "Service Complete! ✓"
✅ Confirmation text with phone number
✅ Auto-dismisses after 5 seconds
✅ Returns to home page
PHASE 5: BACKEND TESTING (API)
Step 17: Test Quote Endpoint via curl
Open terminal and run:

curl -X POST https://genesis-tow-backend-production.up.railway.app/jobs/quote \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "tow",
    "duty_level": "regular",
    "pickup_address": "123 Main St, Atlanta, GA",
    "dropoff_address": "456 Oak Ave, Atlanta, GA",
    "add_insurance": true
  }'

Expected response:

{
  "distanceMiles": 2.5,
  "priceCents": 8700,
  "priceFormatted": "87.00",
  "insuranceFeeCents": 1200
}

Step 18: Test Booking Endpoint via curl
curl -X POST https://genesis-tow-backend-production.up.railway.app/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "tow",
    "duty_level": "regular",
    "pickup_address": "123 Main St, Atlanta, GA",
    "dropoff_address": "456 Oak Ave, Atlanta, GA",
    "customerName": "John Smith",
    "customerPhone": "+14045550123",
    "add_insurance": true,
    "with_vehicle": true,
    "staying_with_vehicle": true,
    "latitude": 33.7501,
    "longitude": -84.3885
  }'

Expected response:

{
  "id": 1,
  "service_type": "tow",
  "customer_name": "John Smith",
  "customer_phone": "+14045550123",
  "distance_miles": 2.5,
  "price_cents": 8700,
  "add_insurance": true,
  "insurance_fee_cents": 1200,
  "driver_id": 3,
  ...
}

Step 19: Test Get Jobs Endpoint
curl https://genesis-tow-backend-production.up.railway.app/jobs

Expected: JSON array of recent jobs with all fields

Step 20: Test Rating Endpoint
Replace {JOB_ID} with an actual job ID from Step 19:

curl -X PATCH https://genesis-tow-backend-production.up.railway.app/jobs/{JOB_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4,
    "tip": 10
  }'

Expected response: Updated job with rating: 4, tip_amount: 10, completed_at: [timestamp]

PHASE 6: ERROR TESTING
Step 21: Test Missing Photos Error
Reload the page
Try to calculate quote without uploading all 6 photos
Expected: Error message: "All 6 vehicle photos are required before proceeding"
Step 22: Test Missing Address Error
Upload all 6 photos
Fill in name & phone
Select service type, vehicle size, etc.
Leave "Pickup Location" blank
Try to calculate quote
Expected: Error message: "Please enter both pickup and dropoff locations"
Step 23: Test Missing Contact Info Error
Leave "Name" field blank
Try to calculate quote
Expected: Error message: "Name and phone number are required"
Step 24: Test Invalid Address Error
Enter Pickup: "xyz123 fake nonsense"
Enter Dropoff: "abc456 not real"
Calculate quote
Expected: Error message: "Could not find location: xyz123 fake nonsense" (or similar)
Step 25: Test Missing Rating Error
On rating screen, don't click any stars
Click "Submit Rating & Tip"
Expected: Error message: "Please select a rating"
PHASE 7: CROSS-BROWSER TESTING (Optional but Recommended)
Step 26: Test on Mobile Browser
Open frontend URL on your phone browser
Go through entire booking flow
Expected: All elements responsive, camera works, forms are touch-friendly
Step 27: Test on Tablet
If available, test on iPad/tablet
Verify layout adapts properly
Step 28: Test on Different Desktop Browser
Try Chrome, Firefox, Safari, or Edge
Verify app works identically
PHASE 8: SMOKE TEST CHECKLIST
Print this and check off as you test:

 Frontend loads without errors
 All 6 photos can be captured
 Service types work (Tow, Roadside, Winch)
 Subtypes appear for Roadside Assistance
 Vehicle size dropdown works
 Insurance toggle works (shows/hides $12)
 Contact form accepts input
 Location capture works
 Address entry works
 Quote calculates correctly
 Quote includes insurance fee if selected
 Booking button works
 Driver card displays after booking
 Call driver button works
 Text driver button works
 Rating screen appears
 Rating submission works
 Completion message shows
 Backend API responds to curl requests
 Jobs are saved in database
 Error messages display appropriately
PHASE 9: WHAT TO DO IF TESTS FAIL
Frontend Not Loading
# Check frontend service status
# Go to Railway Dashboard → genesis-tow-frontend → Deployments
# If failed, check Build Logs for errors

Backend API Errors
# Check backend service logs
# Go to Railway Dashboard → genesis-tow-backend → Deployments → View Logs

Photos Won't Upload
Verify browser has camera permission
Check browser console for JavaScript errors (F12 → Console)
Quote Calculation Fails
Verify OPENCAGE_API_KEY is set in Railway
Test with common addresses like "1600 Pennsylvania Ave, Washington DC"
SMS Not Sending
This is non-critical for MVP testing
If Twilio not set up, it logs to console instead
To enable: Add Twilio credentials to Railway variables
NEXT: PRODUCTION READINESS
After all tests pass, you're ready for:

✅ User acceptance testing (UAT)
✅ Marketing launch
✅ Real driver sign-ups
✅ Real customer bookings
