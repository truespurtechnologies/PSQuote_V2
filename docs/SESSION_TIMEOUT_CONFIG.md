# Session Timeout Configuration

This application uses environment variables to configure session timeout behavior. Here's how to customize these settings:

## Available Environment Variables

### `NEXT_PUBLIC_SESSION_TIMEOUT_MS`
- **Description**: Total session duration in minutes before automatic logout
- **Default**: `30` (30 minutes)
- **Example**: `NEXT_PUBLIC_SESSION_TIMEOUT_MS=60` for a 60-minute session

### `NEXT_PUBLIC_SESSION_WARNING_TIME_MS`
- **Description**: Time in minutes before session timeout when warning should be shown
- **Default**: `5` (5 minutes)
- **Example**: `NEXT_PUBLIC_SESSION_WARNING_TIME_MS=10` to show warning 10 minutes before timeout

## How to Configure

1. Create a `.env.local` file in your project root
2. Add your custom values:
   ```
   NEXT_PUBLIC_SESSION_TIMEOUT_MS=60
   NEXT_PUBLIC_SESSION_WARNING_TIME_MS=10
   ```
3. Restart your development server for changes to take effect

## Notes
- Changes to these values require a server restart
- Values are in minutes (will be converted to milliseconds internally)
- Only values greater than 0 will be accepted; invalid values will fall back to defaults
