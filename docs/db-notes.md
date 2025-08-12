# Database Schema - Ainnovate Dashboard

## Supabase Configuration
- **URL**: `https://krdrqfibrvndkfaenasb.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZHJxZmlicnZuZGtmYWVuYXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMDA1NjcsImV4cCI6MjA3MDU3NjU2N30.7hXeN_nFG7TL3Q8ErF3Zu9LkFNVW5cGwJHYaXQQCX0c`
- **Service Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZHJxZmlicnZuZGtmYWVuYXNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAwMDU2NywiZXhwIjoyMDcwNTc2NTY3fQ.2fiD9NOJoC6K6Zy2sLYm79joqX0xpuZt0QgF4im8lm8`

## Tables Structure

### 1. sections
Main categories for organizing resources.
```sql
- id: uuid (PK, auto-generated)
- name: text (not null)
- slug: text (unique, auto-generated from name)
- icon: text (optional, for UI)
- color: text (optional, for UI)
- order_index: int (default 0, for sorting)
- created_at: timestamptz (default now())
```

### cards
- id (uuid, primary key)
- title (text)
- description (text, nullable)
- url (text)
- image_url (text, nullable)
- type (text, default 'link') - 'link', 'gpt', 'app', 'doc'
- tags (text[], nullable) - array of tags
- is_favorite (boolean, default false)
- section_id (uuid, foreign key to sections.id)
- order_index (integer, default 0)
- created_at (timestamp)
- updated_at (timestamp)

### card_folders (many-to-many relationship)
- card_id (uuid, foreign key to cards.id)
- folder_id (uuid, foreign key to folders.id)
- created_at (timestamp)
- Primary key: (card_id, folder_id)

## Helper Views/Functions

### cards_without_folder
View that returns cards that are not associated with any folder in their section.

```sql
CREATE VIEW cards_without_folder AS
SELECT c.*
FROM cards c
WHERE NOT EXISTS (
  SELECT 1 FROM card_folders cf WHERE cf.card_id = c.id
);
```

### cards_in_tree(root uuid)
Function that returns all cards in a folder tree (including subfolders).

```sql
CREATE OR REPLACE FUNCTION cards_in_tree(root uuid)
RETURNS TABLE(
  card_id uuid,
  title text,
  description text,
  url text,
  image_url text,
  type text,
  tags text[],
  is_favorite boolean,
  section_id uuid,
  order_index integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE folder_tree AS (
    -- Base case: start with the root folder
    SELECT id, parent_id, section_id
    FROM folders
    WHERE id = root
    
    UNION ALL
    
    -- Recursive case: find all child folders
    SELECT f.id, f.parent_id, f.section_id
    FROM folders f
    INNER JOIN folder_tree ft ON f.parent_id = ft.id
  )
  SELECT c.id, c.title, c.description, c.url, c.image_url, c.type, c.tags, c.is_favorite, c.section_id, c.order_index, c.created_at, c.updated_at
  FROM cards c
  INNER JOIN card_folders cf ON c.id = cf.card_id
  INNER JOIN folder_tree ft ON cf.folder_id = ft.id
  ORDER BY c.order_index, c.created_at DESC;
END;
$$ LANGUAGE plpgsql;
```

## Storage

### dashboard-images bucket
Bucket para almacenar imágenes de folders y cards.

**Configuración requerida:**
1. Crear bucket `dashboard-images` en Supabase Storage
2. Configurar políticas públicas para lectura:

```sql
-- Política para permitir lectura pública de imágenes
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'dashboard-images');

-- Política para permitir subida de imágenes (autenticado)
CREATE POLICY "Authenticated upload access" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'dashboard-images');

-- Política para permitir eliminación de imágenes (autenticado)
CREATE POLICY "Authenticated delete access" ON storage.objects
FOR DELETE USING (bucket_id = 'dashboard-images');
```

**Estructura de carpetas:**
- `/folders/` - Imágenes de carpetas
- `/cards/` - Imágenes de cards

## RLS (Row Level Security)

Por ahora RLS está deshabilitado para desarrollo. En producción se recomienda:

1. Habilitar RLS en todas las tablas
2. Crear políticas basadas en autenticación
3. Configurar roles de usuario (admin, editor, viewer)

1. **Sections → Folders**: One-to-many (section can have multiple folders)
2. **Folders → Folders**: Self-referencing (parent_id for hierarchy)
3. **Sections → Cards**: One-to-many (section can have multiple cards)
4. **Cards ↔ Folders**: Many-to-many via card_folders table
## Usage Patterns

### Navigation Structure
- **Home**: Show favorites + recent cards (localStorage)
- **Section View** (`/s/:sectionId`): Show cards without folder + filters
- **Folder View** (`/s/:sectionId/f/:folderId`): Use `cards_in_tree()` to show cards in folder + subfolders
- **Card Detail** (`/c/:cardId`): Modal with card details, actions

### Key Queries
1. List sections: `SELECT * FROM sections ORDER BY order_index`
2. Folder tree: `SELECT * FROM folders WHERE section_id = ? ORDER BY parent_id, order_index`
3. Cards without folder: `SELECT * FROM cards_without_folder WHERE section_id = ?`
4. Cards in folder tree: `SELECT * FROM cards_in_tree(?)`
5. Card-folder relationships: `SELECT * FROM card_folders WHERE card_id = ?`

## Storage
- **Bucket**: `dashboard-images`
- **Usage**: Store card thumbnails and folder images
- **URL Pattern**: Public URLs stored in `image_url` fields

## Security
- RLS (Row Level Security) enabled on all tables
- Currently open policies for development
- Future: Implement user-based access control
