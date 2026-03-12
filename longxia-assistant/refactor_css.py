#!/usr/bin/env python3
"""
CSS UI Refactor Script for 龙虾助手
Replaces specific CSS class blocks with new design system
"""

import re

with open('src/index.css', 'r') as f:
    content = f.read()

original_content = content

# ─────────────────────────────────────────────
# STEP 1: Replace :root variables
# ─────────────────────────────────────────────
# Find :root { ... } block
root_pattern = re.compile(r':root\s*\{[^}]*(?:\}[^}]*?)*?\}', re.DOTALL)

new_root = """:root {
  --red: #E84545;
  --red-dim: rgba(232,69,69,0.1);
  --red-border: rgba(232,69,69,0.25);
  --bg:   #0a0a0b;
  --bg-2: #111113;
  --bg-3: #18181b;
  --bg-4: #1c1c1f;
  --text-1: #fafafa;
  --text-2: #a1a1aa;
  --text-3: #52525b;
  --border: rgba(255,255,255,0.07);
  --border-2: rgba(255,255,255,0.12);
  --radius: 10px;
  --radius-lg: 16px;
  --shadow: 0 1px 3px rgba(0,0,0,0.4);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.5);
  --font: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  /* 保留旧变量别名，兼容现有代码 */
  --lobster-red: #E84545;
  --bg-primary: #0a0a0b;
  --bg-secondary: #111113;
  --bg-card: #18181b;
  --bg-hover: #1c1c1f;
  --text-primary: #fafafa;
  --text-secondary: #a1a1aa;
  --text-muted: #52525b;
  --border-color: rgba(255,255,255,0.07);
  --border-light: rgba(255,255,255,0.07);
  --border-medium: rgba(255,255,255,0.12);
  --border-active: #E84545;
  --radius-sm: 8px;
  --radius-md: 12px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.4);
}"""

# Find exact :root block - it ends at the first closing brace after :root {
root_start = content.find(':root {')
if root_start >= 0:
    # Find matching closing brace
    depth = 0
    i = root_start
    while i < len(content):
        if content[i] == '{':
            depth += 1
        elif content[i] == '}':
            depth -= 1
            if depth == 0:
                root_end = i + 1
                break
        i += 1
    content = content[:root_start] + new_root + content[root_end:]
    print("✅ Step 1: :root variables replaced")
else:
    print("❌ Step 1: :root not found")


# ─────────────────────────────────────────────
# Helper: find and extract a block (class + all rules until balanced })
# ─────────────────────────────────────────────
def find_block_end(text, start_idx):
    """Find the end of a CSS block starting at start_idx, handling nested braces"""
    depth = 0
    i = start_idx
    while i < len(text):
        if text[i] == '{':
            depth += 1
        elif text[i] == '}':
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    return -1


def replace_block(text, selector, new_css, label=""):
    """Replace a specific CSS selector block"""
    idx = text.find(selector)
    if idx < 0:
        print(f"  ⚠️  Not found: {selector}")
        return text, False
    # Find the opening brace
    brace_idx = text.find('{', idx)
    if brace_idx < 0:
        print(f"  ⚠️  No opening brace: {selector}")
        return text, False
    end_idx = find_block_end(text, brace_idx)
    if end_idx < 0:
        print(f"  ⚠️  No closing brace: {selector}")
        return text, False
    text = text[:idx] + new_css + text[end_idx:]
    return text, True


def replace_range(text, start_selector, end_selector_exclusive, new_css, label=""):
    """Replace everything from start_selector up to (not including) end_selector_exclusive"""
    start_idx = text.find(start_selector)
    end_idx = text.find(end_selector_exclusive, start_idx + 1) if start_idx >= 0 else -1
    if start_idx < 0:
        print(f"  ⚠️  Range start not found: {start_selector}")
        return text, False
    if end_idx < 0:
        print(f"  ⚠️  Range end not found: {end_selector_exclusive}")
        return text, False
    text = text[:start_idx] + new_css + "\n" + text[end_idx:]
    return text, True


# ─────────────────────────────────────────────
# STEP 2: Replace Navbar (entire navbar section)
# ─────────────────────────────────────────────
new_navbar = """/* ── Navbar ── */
.navbar {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 60px;
  background: rgba(10,10,11,0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid rgba(255,255,255,0.07);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 4px;
  z-index: 100;
}
.navbar-logo {
  display: none;
}
.navbar-brand { display: none; }
.navbar-title { display: none; }
.navbar-links { display: none; }
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 12px;
  border-radius: 10px;
  cursor: pointer;
  border: none;
  background: transparent;
  color: #52525b;
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  transition: color 0.15s, background 0.15s;
  text-decoration: none;
  min-width: 48px;
}
.nav-item svg, .nav-item .nav-icon {
  font-size: 1.25rem;
  line-height: 1;
}
.nav-item:hover { color: #a1a1aa; }
.nav-item.active {
  color: #E84545;
  background: rgba(232,69,69,0.1);
}
.nav-item.active .nav-label { color: #E84545; }
"""

# Find the navbar section up to the confirm-overlay section
navbar_start = content.find('/* ── 导航栏 ── */')
confirm_start = content.find('/* ── 确认弹窗 ── */')

if navbar_start < 0:
    # Try alternative
    navbar_start = content.find('.navbar {')
    # Extend back to find comment
    comment_search = content.rfind('\n', 0, navbar_start)
    navbar_start = comment_search + 1 if comment_search >= 0 else navbar_start

if navbar_start >= 0 and confirm_start >= 0:
    content = content[:navbar_start] + new_navbar + "\n" + content[confirm_start:]
    print("✅ Step 2: Navbar section replaced")
else:
    print(f"❌ Step 2: navbar_start={navbar_start}, confirm_start={confirm_start}")


# ─────────────────────────────────────────────
# STEP 3: page-title, page-subtitle, section-title
# ─────────────────────────────────────────────

# Replace page-title block
new_page_title = """.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fafafa;
  margin-bottom: 6px;
  letter-spacing: -0.02em;
  line-height: 1.3;
}"""

content, ok = replace_block(content, '.page-title {', new_page_title, "page-title")
print(f"{'✅' if ok else '❌'} Step 3a: .page-title")

# Replace page-subtitle
new_page_subtitle = """.page-subtitle {
  font-size: 0.875rem;
  color: #71717a;
  margin-bottom: 28px;
  line-height: 1.6;
  font-weight: 400;
}"""
content, ok = replace_block(content, '.page-subtitle {', new_page_subtitle, "page-subtitle")
print(f"{'✅' if ok else '❌'} Step 3b: .page-subtitle")

# Replace section-title
new_section_title = """.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #52525b;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 14px;
}"""
content, ok = replace_block(content, '.section-title {', new_section_title, "section-title")
print(f"{'✅' if ok else '❌'} Step 3c: .section-title")


# ─────────────────────────────────────────────
# STEP 4: Buttons
# ─────────────────────────────────────────────

new_btn = """.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
  text-decoration: none;
  white-space: nowrap;
  min-height: 36px;
}"""
content, ok = replace_block(content, '.btn {', new_btn, "btn")
print(f"{'✅' if ok else '❌'} Step 4a: .btn")

# Remove old .btn:disabled and .btn:active lines (they follow right after .btn)
# We'll handle these below by just leaving them (they won't conflict much)

new_btn_primary = """.btn-primary {
  background: #E84545;
  color: #fff;
  border-color: #E84545;
}
.btn-primary:hover {
  background: #d63939;
  border-color: #d63939;
}
.btn-primary:disabled {
  background: #3f1f1f;
  border-color: #3f1f1f;
  color: #7f4f4f;
  cursor: not-allowed;
}"""

content, ok = replace_block(content, '.btn-primary {', new_btn_primary, "btn-primary")
# Also need to replace the :hover block
idx_hover = content.find('.btn-primary:hover:not(:disabled) {')
if idx_hover >= 0:
    end_idx = find_block_end(content, content.find('{', idx_hover))
    content = content[:idx_hover] + content[end_idx:]
    print("✅ Step 4b: removed old .btn-primary:hover:not(:disabled)")

print(f"{'✅' if ok else '❌'} Step 4b: .btn-primary")

new_btn_secondary = """.btn-secondary {
  background: transparent;
  color: #a1a1aa;
  border-color: rgba(255,255,255,0.12);
}
.btn-secondary:hover {
  background: rgba(255,255,255,0.05);
  color: #fafafa;
  border-color: rgba(255,255,255,0.18);
}"""

content, ok = replace_block(content, '.btn-secondary {', new_btn_secondary, "btn-secondary")
idx_hover2 = content.find('.btn-secondary:hover:not(:disabled) {')
if idx_hover2 >= 0:
    end_idx2 = find_block_end(content, content.find('{', idx_hover2))
    content = content[:idx_hover2] + content[end_idx2:]
    print("✅ removed old .btn-secondary:hover:not(:disabled)")
print(f"{'✅' if ok else '❌'} Step 4c: .btn-secondary")


# ─────────────────────────────────────────────
# STEP 5: HomeHub  
# ─────────────────────────────────────────────

new_hub = """/* ── HomeHub ── */
.hub-page { padding-bottom: 32px; }
.hub-hero {
  padding: 32px 0 28px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  margin-bottom: 32px;
}
.hub-badge { display: none; }
.hub-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #fafafa;
  letter-spacing: -0.03em;
  margin-bottom: 8px;
  line-height: 1.2;
}
.hub-subtitle {
  font-size: 0.9rem;
  color: #71717a;
  line-height: 1.7;
  max-width: 480px;
}
.hub-section { margin-bottom: 36px; }
.hub-section-title {
  font-size: 0.72rem;
  font-weight: 600;
  color: #52525b;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 14px;
}
.hub-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.hub-card {
  background: #18181b;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 18px 16px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.hub-card:hover {
  border-color: rgba(255,255,255,0.14);
  background: #1c1c1f;
}
.hub-card-emoji {
  font-size: 1.4rem;
  margin-bottom: 2px;
}
.hub-card-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #fafafa;
}
.hub-card-desc {
  font-size: 0.78rem;
  color: #71717a;
  line-height: 1.5;
}
.hub-case-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.hub-case-card {
  background: #18181b;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.15s;
}
.hub-case-card:hover {
  border-color: rgba(255,255,255,0.14);
}
.hub-case-emoji { font-size: 1.2rem; margin-bottom: 6px; }
.hub-case-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #fafafa;
  margin-bottom: 4px;
}
.hub-case-text {
  font-size: 0.75rem;
  color: #71717a;
  line-height: 1.5;
}
.hub-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.hub-step {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  font-size: 0.875rem;
  color: #a1a1aa;
}
.hub-step span {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(232,69,69,0.15);
  color: #E84545;
  font-size: 0.72rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}
.hub-download-section { margin-top: 8px; }
.hub-download-card {
  background: #18181b;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.hub-download-icon { font-size: 2rem; }
.hub-download-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #fafafa;
  margin-bottom: 3px;
}
.hub-download-desc {
  font-size: 0.78rem;
  color: #71717a;
}
"""

# Find hub section and replace (from .hub-page to next major section)
hub_page_start = content.find('.hub-page {')
# Find what comes after hub section - look for next major comment or unrelated section
# Search for .quick-scene-grid which should be right after hub
quick_scene_start = content.find('.quick-scene-grid {')

if hub_page_start >= 0 and quick_scene_start >= 0:
    # Go back in content to find any comment before .hub-page
    search_back = content.rfind('\n', 0, hub_page_start)
    # Check if there's a comment on the line before
    line_before = content[search_back:hub_page_start].strip()
    if line_before.startswith('/*'):
        real_start = search_back + 1
    else:
        real_start = hub_page_start
    
    content = content[:real_start] + new_hub + "\n" + content[quick_scene_start:]
    print("✅ Step 5: HomeHub section replaced")
else:
    print(f"❌ Step 5: hub_page={hub_page_start}, quick_scene={quick_scene_start}")
    # Try to find the end differently
    if hub_page_start >= 0:
        # Find all lines with .hub-* and replace individual ones
        print("  Attempting individual hub replacements...")


# ─────────────────────────────────────────────
# STEP 6: Chat styles
# ─────────────────────────────────────────────

new_chat = """/* ── Chat ── */
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.chat-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0 14px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  flex-shrink: 0;
  margin-bottom: 0;
}
.chat-topbar-info { display: flex; align-items: center; gap: 10px; }
.chat-topbar-avatar {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: rgba(232,69,69,0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}
.chat-topbar-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #fafafa;
}
.chat-topbar-sub {
  font-size: 0.72rem;
  color: #52525b;
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.msg-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  max-width: 100%;
}
.msg-row--user { flex-direction: row-reverse; }
.msg-row--bot { align-self: flex-start; }
.msg-avatar {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: #18181b;
  border: 1px solid rgba(255,255,255,0.07);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  flex-shrink: 0;
}
.msg-avatar--user {
  background: rgba(232,69,69,0.12);
  border-color: rgba(232,69,69,0.2);
}
.msg-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 78%;
}
.msg-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 0.9rem;
  line-height: 1.65;
  word-break: break-word;
}
.msg-bubble--user {
  background: #E84545;
  color: #fff;
  border-bottom-right-radius: 4px;
}
.msg-bubble--bot {
  background: #18181b;
  color: #e4e4e7;
  border: 1px solid rgba(255,255,255,0.07);
  border-bottom-left-radius: 4px;
}
.msg-bubble--error {
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
  color: #fca5a5;
  border-bottom-left-radius: 4px;
}
.msg-time {
  font-size: 0.65rem;
  color: #3f3f46;
  padding: 0 4px;
}
.msg-time--right { text-align: right; }
.msg-actions {
  display: flex;
  gap: 6px;
  padding: 0 2px;
}
.msg-action-btn {
  font-size: 0.7rem;
  color: #52525b;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 5px;
  transition: all 0.15s;
}
.msg-action-btn:hover { color: #a1a1aa; background: rgba(255,255,255,0.05); }
.msg-action-btn--saved { color: #E84545; }
.chat-input-area {
  flex-shrink: 0;
  padding: 12px 0 0;
  border-top: 1px solid rgba(255,255,255,0.07);
}
.chat-input-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}
.chat-textarea {
  flex: 1;
  background: #18181b;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: #fafafa;
  font-size: 0.9rem;
  padding: 10px 14px;
  resize: none;
  font-family: var(--font);
  line-height: 1.5;
  transition: border-color 0.15s;
  min-height: 42px;
  max-height: 120px;
}
.chat-textarea:focus {
  outline: none;
  border-color: rgba(232,69,69,0.4);
}
.chat-textarea::placeholder { color: #3f3f46; }
.chat-textarea:disabled { opacity: 0.5; }
.chat-send-btn {
  padding: 10px 16px !important;
  min-height: 42px !important;
  font-size: 0.85rem !important;
  border-radius: 10px !important;
  flex-shrink: 0;
}
.chat-input-hint {
  font-size: 0.68rem;
  color: #3f3f46;
  margin-top: 6px;
  padding: 0 2px;
}
.voice-btn {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.1);
  background: #18181b;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}
.voice-btn:hover { border-color: rgba(255,255,255,0.18); }
.voice-btn--active {
  background: rgba(232,69,69,0.12);
  border-color: rgba(232,69,69,0.3);
}
"""

# Find chat section
chat_start = content.find('.chat-page {')
# Find what comes after chat section
# Look for tasks-page
tasks_page_start = content.find('.tasks-page {')

if chat_start >= 0 and tasks_page_start >= 0:
    # go back to find comment
    search_back = content.rfind('\n', 0, chat_start)
    line_before = content[search_back:chat_start].strip()
    if line_before.startswith('/*'):
        real_start = search_back + 1
    else:
        real_start = chat_start
    
    content = content[:real_start] + new_chat + "\n" + content[tasks_page_start:]
    print("✅ Step 6: Chat section replaced")
else:
    print(f"❌ Step 6: chat={chat_start}, tasks={tasks_page_start}")


# ─────────────────────────────────────────────
# STEP 7: Tasks styles
# ─────────────────────────────────────────────

new_tasks = """/* ── Tasks ── */
.tasks-page { padding-bottom: 32px; }
.task-feedback {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.82rem;
  margin-bottom: 16px;
  font-weight: 500;
}
.task-feedback.success {
  background: rgba(34,197,94,0.08);
  border: 1px solid rgba(34,197,94,0.2);
  color: #86efac;
}
.task-feedback.warning {
  background: rgba(245,158,11,0.08);
  border: 1px solid rgba(245,158,11,0.2);
  color: #fcd34d;
}
.quick-scene-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 28px;
}
.quick-scene-card {
  background: #18181b;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  padding: 14px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}
.quick-scene-card:hover {
  border-color: rgba(255,255,255,0.14);
  background: #1c1c1f;
}
.quick-scene-emoji { font-size: 1.4rem; }
.quick-scene-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #e4e4e7;
}
.quick-scene-state {
  font-size: 0.65rem;
  color: #52525b;
}
.task-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.task-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: #18181b;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  transition: all 0.15s;
}
.task-card:hover { border-color: rgba(255,255,255,0.12); }
.task-card--active {
  border-left: 3px solid #E84545;
  background: rgba(232,69,69,0.04);
}
.task-emoji { font-size: 1.3rem; flex-shrink: 0; }
.task-info { flex: 1; min-width: 0; }
.task-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #fafafa;
  margin-bottom: 2px;
}
.task-desc {
  font-size: 0.75rem;
  color: #71717a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.task-time {
  font-size: 0.68rem;
  color: #52525b;
  margin-top: 3px;
}
.task-time--active { color: #4ade80; }
.task-toggle-btn {
  flex-shrink: 0;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid;
  transition: all 0.15s;
}
.task-toggle-btn--off {
  background: transparent;
  border-color: rgba(255,255,255,0.12);
  color: #a1a1aa;
}
.task-toggle-btn--off:hover {
  border-color: #E84545;
  color: #E84545;
}
.task-toggle-btn--on {
  background: rgba(232,69,69,0.1);
  border-color: rgba(232,69,69,0.2);
  color: #E84545;
}
.task-toggle-btn--on:hover { opacity: 0.85; }
.task-toggle-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.category-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.cat-tab {
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.08);
  background: transparent;
  color: #71717a;
  transition: all 0.15s;
}
.cat-tab:hover { color: #a1a1aa; border-color: rgba(255,255,255,0.14); }
.cat-tab.active {
  background: rgba(232,69,69,0.1);
  border-color: rgba(232,69,69,0.2);
  color: #E84545;
}
.tasks-tip-box {
  margin-top: 28px;
  padding: 14px 16px;
  background: #18181b;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  font-size: 0.78rem;
  color: #71717a;
  line-height: 1.6;
}
.page-subtitle {
  font-size: 0.875rem;
  color: #71717a;
  margin-bottom: 28px;
  line-height: 1.6;
  font-weight: 400;
}
.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #52525b;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 14px;
}
.time-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
}
.time-modal {
  background: #18181b;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px 20px 0 0;
  padding: 24px 20px;
  width: 100%;
  max-width: 520px;
  max-height: 80vh;
  overflow-y: auto;
}
.time-modal-title {
  font-size: 1rem;
  font-weight: 600;
  color: #fafafa;
  margin-bottom: 18px;
}
.time-selector-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #52525b;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 10px;
}
.time-selector-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  margin-bottom: 16px;
}
.time-option {
  padding: 8px 10px;
  border-radius: 7px;
  border: 1px solid rgba(255,255,255,0.08);
  background: transparent;
  color: #a1a1aa;
  font-size: 0.8rem;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s;
}
.time-option:hover { border-color: rgba(255,255,255,0.15); color: #fafafa; }
.time-option--active {
  background: rgba(232,69,69,0.1);
  border-color: rgba(232,69,69,0.25);
  color: #E84545;
}
.time-modal-btns { display: flex; gap: 10px; margin-top: 20px; }
.time-cancel-btn {
  flex: 1;
  padding: 11px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1);
  background: transparent;
  color: #a1a1aa;
  font-size: 0.875rem;
  cursor: pointer;
}
.time-confirm-btn {
  flex: 2;
  padding: 11px;
  border-radius: 8px;
  border: none;
  background: #E84545;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}
.time-confirm-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.task-time--active { color: #4ade80; }
"""

# Find tasks section - goes from .tasks-page to family-page
tasks_start = content.find('.tasks-page {')
family_page_start = content.find('.family-page {')

if tasks_start >= 0 and family_page_start >= 0:
    # Go back to find comment
    search_back = content.rfind('\n', 0, tasks_start)
    line_before = content[search_back:tasks_start].strip()
    if line_before.startswith('/*'):
        real_start = search_back + 1
    else:
        real_start = tasks_start
    
    content = content[:real_start] + new_tasks + "\n" + content[family_page_start:]
    print("✅ Step 7: Tasks section replaced")
else:
    print(f"❌ Step 7: tasks={tasks_start}, family={family_page_start}")


# ─────────────────────────────────────────────
# STEP 8: Family styles
# ─────────────────────────────────────────────

new_family = """/* ── Family ── */
.family-page { padding-bottom: 32px; }
.family-feedback {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.82rem;
  margin-bottom: 16px;
  background: rgba(34,197,94,0.08);
  border: 1px solid rgba(34,197,94,0.2);
  color: #86efac;
  font-weight: 500;
}
.family-entry-banner {
  padding: 16px;
  background: rgba(232,69,69,0.06);
  border: 1px solid rgba(232,69,69,0.15);
  border-radius: 12px;
  margin-bottom: 24px;
}
.family-entry-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #fca5a5;
  margin-bottom: 4px;
}
.family-entry-desc {
  font-size: 0.78rem;
  color: #71717a;
  line-height: 1.6;
}
.family-members {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 24px;
}
.family-member-card {
  background: #18181b;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px;
  padding: 18px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
  position: relative;
  transition: all 0.15s;
}
.family-member-card--active {
  border-color: rgba(232,69,69,0.35);
  background: rgba(232,69,69,0.04);
}
.family-active-badge {
  position: absolute;
  top: 10px; right: 10px;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  background: #E84545;
  color: #fff;
  letter-spacing: 0.04em;
}
.family-member-emoji {
  font-size: 2.2rem;
  line-height: 1;
  margin-bottom: 2px;
}
.family-member-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #fafafa;
}
.family-simple-badge {
  font-size: 0.65rem;
  padding: 2px 8px;
  border-radius: 20px;
  background: rgba(251,146,60,0.12);
  border: 1px solid rgba(251,146,60,0.2);
  color: #fb923c;
}
.family-elder-active-tag {
  font-size: 0.7rem;
  color: #fb923c;
}
.family-greeting {
  font-size: 0.72rem;
  color: #52525b;
  font-style: italic;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.family-card-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  width: 100%;
}
.family-use-btn {
  flex: 1;
  padding: 7px 0;
  border-radius: 7px;
  border: none;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.family-use-btn:hover { opacity: 0.85; }
.family-edit-btn, .family-del-btn {
  padding: 7px 10px;
  border-radius: 7px;
  font-size: 0.75rem;
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.1);
  background: transparent;
  color: #71717a;
  transition: all 0.15s;
}
.family-edit-btn:hover { color: #fafafa; border-color: rgba(255,255,255,0.2); }
.family-del-btn:hover { color: #fca5a5; border-color: rgba(239,68,68,0.2); }
.family-add-card {
  background: #18181b;
  border: 1px dashed rgba(255,255,255,0.1);
  border-radius: 14px;
  padding: 28px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.15s;
  color: #52525b;
}
.family-add-card:hover {
  border-color: rgba(232,69,69,0.3);
  color: #E84545;
}
.family-empty {
  text-align: center;
  padding: 60px 20px;
}
.family-empty-emoji { font-size: 3rem; margin-bottom: 16px; }
.family-empty-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #fafafa;
  margin-bottom: 8px;
}
.family-empty-desc {
  font-size: 0.875rem;
  color: #71717a;
  line-height: 1.6;
  margin-bottom: 24px;
}
.family-empty-btn {
  padding: 10px 20px;
  border-radius: 8px;
  background: #E84545;
  color: #fff;
  border: none;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}
.family-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.family-modal {
  background: #18181b;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px 20px 0 0;
  padding: 24px 20px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
}
.family-modal-title {
  font-size: 1rem;
  font-weight: 700;
  color: #fafafa;
  margin-bottom: 20px;
}
.family-form-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #52525b;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.family-preset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 18px;
}
.family-preset-btn {
  padding: 10px 6px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.08);
  background: transparent;
  color: #a1a1aa;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: all 0.15s;
}
.family-preset-btn:hover { border-color: rgba(255,255,255,0.15); color: #fafafa; }
.family-preset-btn.active {
  border-color: rgba(232,69,69,0.3);
  background: rgba(232,69,69,0.08);
  color: #fca5a5;
}
.family-preset-btn span:first-child { font-size: 1.6rem; }
.family-input {
  width: 100%;
  background: #111113;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  color: #fafafa;
  font-size: 0.9rem;
  padding: 10px 14px;
  margin-bottom: 18px;
  font-family: var(--font);
  transition: border-color 0.15s;
}
.family-input:focus {
  outline: none;
  border-color: rgba(232,69,69,0.4);
}
.family-input::placeholder { color: #3f3f46; }
.family-theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 18px;
}
.family-theme-btn {
  padding: 8px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}
.family-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-top: 1px solid rgba(255,255,255,0.07);
  border-bottom: 1px solid rgba(255,255,255,0.07);
  margin-bottom: 18px;
}
.family-switch-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #fafafa;
}
.family-switch-desc {
  font-size: 0.72rem;
  color: #71717a;
  margin-top: 2px;
}
.family-toggle {
  padding: 5px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.12);
  background: transparent;
  color: #71717a;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.family-toggle--on {
  background: rgba(232,69,69,0.12);
  border-color: rgba(232,69,69,0.25);
  color: #E84545;
}
.family-modal-btns { display: flex; gap: 10px; margin-top: 20px; }
.family-cancel-btn {
  flex: 1;
  padding: 11px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1);
  background: transparent;
  color: #a1a1aa;
  font-size: 0.875rem;
  cursor: pointer;
}
.family-save-btn {
  flex: 2;
  padding: 11px;
  border-radius: 8px;
  border: none;
  background: #E84545;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}
.family-save-btn:disabled {
  background: #3f1f1f;
  color: #7f4f4f;
  cursor: not-allowed;
}
.family-tip {
  margin-top: 24px;
  padding: 14px 16px;
  background: #18181b;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  font-size: 0.78rem;
  color: #71717a;
  line-height: 1.6;
}
"""

# Find family section - goes from .family-page to end of family section
# The family section is followed by .voice-btn
family_start = content.find('.family-page {')
voice_btn_start = content.find('.voice-btn {')

if family_start >= 0 and voice_btn_start >= 0:
    # Go back to find comment
    search_back = content.rfind('\n', 0, family_start)
    line_before = content[search_back:family_start].strip()
    if line_before.startswith('/*'):
        real_start = search_back + 1
    else:
        real_start = family_start
    
    content = content[:real_start] + new_family + "\n" + content[voice_btn_start:]
    print("✅ Step 8: Family section replaced")
else:
    print(f"❌ Step 8: family={family_start}, voice_btn={voice_btn_start}")


# ─────────────────────────────────────────────
# Write result
# ─────────────────────────────────────────────
with open('src/index.css', 'w') as f:
    f.write(content)

print(f"\n✅ Done! File written. Original={len(original_content)} chars, New={len(content)} chars")
PYEOF
