# Ainnovate Dashboard

A modern internal dashboard for managing company resources with a visual router interface.

## Features

- **Modern UI**: Built with React, Tailwind CSS, and shadcn/ui components
- **Hierarchical Organization**: Sections → Folders → Cards structure
- **Visual Navigation**: Sidebar with expandable folder tree
- **Search & Filters**: Global search (Ctrl+K) and advanced filtering
- **Favorites & Recents**: Track frequently used resources
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Toggle between themes
- **Image Support**: Upload images for cards and folders
- **Drag & Drop**: Reorder items (planned feature)
- **Import/Export**: Backup and restore data (planned feature)

## Tech Stack

- **Frontend**: React 18 + JavaScript (Vite)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **State Management**: TanStack Query (React Query)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage for images

## Database Schema

The application uses the following Supabase tables:

- `sections`: Main categories (GPTs, Ads, etc.)
- `folders`: Hierarchical folders within sections
- `cards`: Individual resource items
- `card_folders`: Many-to-many relationship between cards and folders

See `/docs/db-notes.md` for detailed schema information.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ainnovate-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:
   - Run the SQL schema from `/docs/db-notes.md` in your Supabase SQL editor
   - Create the `dashboard-images` storage bucket
   - Configure RLS policies as needed

5. Start the development server:
```bash
npm run dev
```

## Usage

### Navigation

- **Home**: View favorites and recent items
- **Sections**: Browse resources by category

```
src/
├── components/
│   ├── ui/           # shadcn/ui base components (Button, Input, Dialog, etc.)
│   ├── layout/       # Layout components (Sidebar, Topbar)
│   ├── sections/     # Section management (SectionForm, SectionSelector)
│   ├── folders/      # Folder management (FolderForm, FolderTree, DnD)
│   ├── cards/        # Card management (Card, CardForm, CardGrid, DnD)
│   ├── search/       # Global search (CommandK palette)
│   └── admin/        # Admin tools (Import/Export)
├── pages/            # Route pages (Home, SectionView, FolderView, CardDetail)
├── hooks/            # Custom React hooks (useFavorites, useRecent)
├── lib/              # Utilities and API functions (queries, utils, supabase)
├── contexts/         # React contexts (ToastContext)
└── docs/             # Documentation (database schema, setup notes)
```

## 🗃️ Database Setup

### Required Tables

Run these SQL commands in your Supabase SQL editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sections table
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Folders table
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  image_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cards table
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  image_url TEXT,
  type TEXT DEFAULT 'link',
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT FALSE,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Card-Folder relationship table
CREATE TABLE card_folders (
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (card_id, folder_id)
);
```

### Helper Views and Functions

See `docs/db-notes.md` for the complete SQL setup including:
- `cards_without_folder` view
- `cards_in_tree(root uuid)` function
- Storage bucket configuration

## 🎯 Usage

### Basic Workflow

1. **Create Sections**: Organize your resources into main categories
2. **Add Folders**: Create hierarchical folder structures within sections
3. **Add Cards**: Store your actual resources (links, tools, documents)
4. **Organize**: Use drag & drop to reorder and organize everything
5. **Search**: Use Ctrl+K for instant global search
6. **Backup**: Export your data anytime for backup or migration

### Keyboard Shortcuts

- `Ctrl+K` / `Cmd+K`: Open global search
- `Escape`: Close modals and search
- Drag & Drop: Reorder sections, folders, and cards

### Features in Detail

- **Favorites**: Click the heart icon on any card to mark as favorite
- **Recent Items**: Automatically tracks your recently accessed cards
- **Image Upload**: Add images to folders and cards via the forms
- **Tags**: Organize cards with custom tags for better searchability
- **Import/Export**: Full data backup and restore functionality

## 🔧 Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

### Environment Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Custom configuration
VITE_APP_NAME=Ainnovate Dashboard
```

## 🚀 Deployment

### Netlify (Recommended)

1. Build the project: `npm run build`
2. Deploy the `dist` folder to Netlify
3. Set environment variables in Netlify dashboard
4. Configure redirects for SPA routing

### Other Platforms

The app can be deployed to any static hosting service:
- Vercel
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting

## 📚 Documentation

- `docs/db-notes.md`: Complete database schema and setup
- Component documentation: See individual component files
- API documentation: See `src/lib/queries.js`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the documentation in `docs/`
2. Review the database setup in `docs/db-notes.md`
3. Ensure all environment variables are correctly set
4. Verify Supabase configuration and permissions
Contact the development team or create an issue in the repository.
