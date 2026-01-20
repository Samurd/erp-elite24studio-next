
import re
import os

schema_path = '/home/samurdp/dev_projects/elite-erp/erp-elite-next/drizzle/schema.ts'
relations_path = '/home/samurdp/dev_projects/elite-erp/erp-elite-next/drizzle/relations.ts'
auth_path = '/home/samurdp/dev_projects/elite-erp/erp-elite-next/lib/auth.ts'

# Mappings: old_name -> new_name
# We derive new_name by stripping 'nextjs' and lowercasing first letter (camelCase)
# But we need to handle the table name string too: "nextjs_sessions" -> "sessions"

# Transformations needed:
# 1. Export const renaming: nextjsSessions -> sessions
# 2. Table name renaming: pgTable("nextjs_sessions", ...) -> pgTable("sessions", ...)
# 3. Conflict resolution: If 'export const sessions' exists elsewhere, remove that block.

def process_file_content(content, replacements, conflict_names):
    lines = content.split('\n')
    new_lines = []
    
    # Identify blocks to skip (conflicts)
    # We scan for 'export const <conflict_name> =' and skip until ']);' or end of block.
    
    skip_ranges = [] # List of (start_line_idx, end_line_idx)
    
    for conflict in conflict_names:
        # Regex to find the start of the defined table we want to DELETE
        # e.g. export const sessions = pgTable(...)
        # We need to be careful not to match the ONE we are renaming (which currently is nextjsSessions)
        # The conflict is the OLD table.
        pattern = re.compile(rf'export const {conflict}\s*=\s*(pgTable|mysqlTable)\(')
        
        for i, line in enumerate(lines):
            if pattern.search(line):
                # Found a block to remove. Find end.
                start = i
                end = -1
                # naive block end finder: look for ']);' which ends table definitions in this file usually.
                # or just indentation based?
                # The drizzle definitions usually end with trailing `]);`
                for j in range(i, len(lines)):
                    if lines[j].strip().endswith(']);') or lines[j].strip().endswith('});'): # handling potential variations
                         end = j
                         break
                
                if end != -1:
                    skip_ranges.append((start, end))
                    print(f"Marked for removal: {conflict} at lines {start}-{end}")
                else:
                    print(f"Warning: Could not find end of block for {conflict} starting at {start}")

    # Build new content excluding skipped ranges
    cleaned_lines = []
    skip_ranges.sort()
    
    current_line = 0
    for i, line in enumerate(lines):
        skip = False
        for start, end in skip_ranges:
            if start <= i <= end:
                skip = True
                break
        if not skip:
            cleaned_lines.append(line)
            
    content = '\n'.join(cleaned_lines)
    
    # Now perform renaming
    for old, new in replacements.items():
        # Rename const export
        # export const nextjsSessions -> export const sessions
        content = re.sub(rf'export const {old}\b', f'export const {new}', content)
        
        # Rename usage references
        # nextjsSessions.id -> sessions.id
        content = re.sub(rf'\b{old}\.', f'{new}.', content)
        
        # Rename usages in relations: many(nextjsSessions) -> many(sessions)
        content = re.sub(rf'\b{old}\b', new, content)
        
        # Rename table string name
        # pgTable("nextjs_sessions", ...) -> pgTable("sessions", ...)
        # derivation: snake_case removal of nextjs_
        # nextjs_sessions -> sessions
        # nextjs_user_roles -> user_roles
        
        # We can try to infer snake case removal
        # "nextjs_foo" -> "foo"
        content = re.sub(r'"nextjs_([a-zA-Z0-9_]+)"', r'"\1"', content)
        
        # Handle specific cases if inference fails or if "nextjsUsers" was "nextjs_users"
        
    return content

def run():
    # 1. Schema
    with open(schema_path, 'r') as f:
        schema_content = f.read()

    # Define targets
    # We look for export const nextjs...
    
    matches = re.findall(r'export const (nextjs[a-zA-Z0-9]+)', schema_content)
    targets = list(set(matches)) # unique
    
    print(f"Targets found: {targets}")
    
    replacements = {}
    conflicts = []
    
    for t in targets:
        # nextjsSessions -> sessions
        # Remove 'nextjs' and lower first char of remainder? 
        # Actually 'Sessions' -> 'sessions'
        remainder = t[6:] # Strip 'nextjs'
        new_name = remainder[0].lower() + remainder[1:]
        
        replacements[t] = new_name
        conflicts.append(new_name)
        
    print(f"Replacements: {replacements}")
    print(f"Potential conflicts to remove: {conflicts}")
    
    new_schema = process_file_content(schema_content, replacements, conflicts)
    
    with open(schema_path, 'w') as f:
        f.write(new_schema)
        
    # 2. Relations
    with open(relations_path, 'r') as f:
        relations_content = f.read()
        
    # Relations doesn't have the "export const sessions = pgTable..." conflict (those are in schema)
    # But it might accept `nextjsSessions` in imports.
    # We just need to do the renaming text replacement.
    
    # Note: process_file_content logic for renaming works on text. 
    # But we passed conflict_names which triggers deletion. We don't want deletion in relations.ts based on table definition logic.
    # So we split the logic.
    
    # Just text replacement for relations.ts
    for old, new in replacements.items():
        relations_content = re.sub(rf'\b{old}\b', new, relations_content)
        relations_content = re.sub(r'"nextjs_([a-zA-Z0-9_]+)"', r'"\1"', relations_content) # relation names string if any
        
    with open(relations_path, 'w') as f:
        f.write(relations_content)

    # 3. Auth
    if os.path.exists(auth_path):
        with open(auth_path, 'r') as f:
            auth_content = f.read()
        
        for old, new in replacements.items():
             auth_content = re.sub(rf'\b{old}\b', new, auth_content)
             
        with open(auth_path, 'w') as f:
            f.write(auth_content)


run()
