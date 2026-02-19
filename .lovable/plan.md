
# Remove the Endpoint Gate — Always Show Webhook Events

## What Changes

The `{!endpointVerified ? (lock gate) : (accordion)}` ternary in the Event Subscriptions card is removed. The accordion renders unconditionally, exactly as it did before the gate was added.

The Test Endpoint button, result strip, and all associated state (`isTestingUrl`, `urlTestStatus`, `urlTestLatency`) are kept as-is — the endpoint test feature stays, it just no longer controls visibility of the event list.

## Technical Details

### In `src/pages/Webhooks.tsx`

- Lines 537–554: Delete the lock gate JSX (`!endpointVerified` branch + the ternary wrapper)
- Line 554 `) : (` and the closing `)` of the ternary: remove so the accordion renders directly inside `<CardContent>`
- The `endpointVerified` derived constant and the `handleTestUrl` / state variables remain untouched (they still power the Test button UI)

### Result

```
<CardContent className="p-0">
  <Accordion ...>
    {/* all groups render as normal */}
  </Accordion>
</CardContent>
```

No other files need to change.
