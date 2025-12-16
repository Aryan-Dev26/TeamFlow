# Authentication System Test

## Test Steps:

1. **Visit the application**: http://localhost:3000
2. **Navigate to Sign Up**: Click "Get Started" or go to `/auth/signup`
3. **Create a new account**:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123
4. **Verify redirect**: Should redirect to `/dashboard` after successful signup
5. **Check user display**: 
   - Sidebar should show "Test User" and "test@example.com"
   - Header avatar should show "TU" initials
6. **Test logout**: Click user menu → Sign Out
7. **Verify redirect**: Should redirect to `/auth/signin`
8. **Test login**:
   - Email: test@example.com
   - Password: password123
9. **Verify user persistence**: User data should be maintained across sessions

## Expected Behavior:

- ✅ User registration creates unique user ID
- ✅ User data is stored in localStorage with user-specific namespace
- ✅ Dashboard shows authenticated user information
- ✅ Route protection prevents unauthenticated access
- ✅ Logout clears session and redirects to signin
- ✅ Login restores user session and data
- ✅ Each user has isolated data storage

## User Data Storage:

- Users list: `teamflow_users` (array of all registered users)
- Current session: `teamflow_user` (current logged-in user)
- User-specific data: `teamflow_data_${userId}` (tasks, boards, etc.)

## Demo Users:

For quick testing, the system accepts any email/password combination and creates a demo user.