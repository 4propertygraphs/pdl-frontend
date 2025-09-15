# Property Interface

Dashboard interface to audit properties in multiple APIs


## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **Routing**: React Router
- **API**: Axios
- **Build Tool**: Vite

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd property-interface
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env` and update values as needed.

```
   VITE_REACT_APP_API_URL= Backend API URL (e.g., http://localhost:3000/api)
   VITE_REACT_APP_PRODUCTION= True or false
   VITE_REACT_APP_FILE_LOCATION= Location of project in web server (e.g., /property-interface) leave empty if hosted at root
```
4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Preview the production build**
   ```bash
   npm run preview
   ```


## Scripts

- `npm run dev` — Start the development server
- `npm run build` — Build the project for production
- `npm run preview` — Preview the production build
- `npm run lint` — Run ESLint


## License

MIT License
