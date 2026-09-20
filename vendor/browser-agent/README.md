# Hopper local browser connector

This optional MCP package binds to **127.0.0.1 only** and transports operations to
one explicitly selected browser page. Product code, schemas, records and consent
stay with the product. No hosted relay, cloud database, account or provider key.

Choose **Connect this page** in Hopper, then copy the generated MCP configuration.
It includes a short-lived page ticket. Start `hopper-browser-agent mcp --bind TICKET`
through your MCP client. Use `page_status`, `page_describe`, `page_tools`, then
`page_call` with a tool and arguments from that exact page. The page may request
local-network permission. Copying or installing alone does not pair a page.
Keep the tab open. Stop, reload, navigation or disconnect requires a new binding.
An operation delivered before Stop may finish: read back before retrying.

`hopper-browser-agent doctor` checks Node compatibility. Local MCP uses stdio;
only protocol messages go to stdout. Ticket material is ephemeral and belongs in
local client configuration, not public links or source control. Remove an expired
page-specific entry or replace its ticket when reconnecting.

Research exposes the same connector through its optional `mcp --bind` flag;
without that flag its fixed calculations are stateless and require no browser.
This connector advertises only transport tools, never fabricated product support.

Source: Hopper Platform `packages/browser-agent-transport/local`. For source development, use Bun: run `bun install`,
`bun run check`, then `npm pack` here. The published tarball bundles its protocol SDK;
visitors do not need the Platform monorepo or a build tool.
