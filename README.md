# 🚗 Smart Parking Frontend - Sistema de Parcare Inteligentă

O aplicație web modernă pentru gestionarea parcărilor inteligente, construită cu **React** și **CSS modern**. Oferă o experiență de utilizator excelentă cu funcționalități avansate pentru rezervări, gestionarea vehiculelor și monitorizarea în timp real.

## 🌟 **Funcționalități Principale**

### 🎯 **Core Features**
- ✅ **Autentificare Securizată** - Login/Register cu validare avansată
- ✅ **Dashboard Interactiv** - Vizualizare în timp real a locurilor de parcare
- ✅ **Gestionare Vehicule** - Adăugarea și gestionarea mașinilor personale
- ✅ **Sistem Abonamente** - Cumpărarea și gestionarea abonamentelor

### 🚀 **Advanced Features** 
- ✅ **Rezervări Inteligente** - Rezervarea locurilor cu opțiuni flexibile de timp
- ✅ **Notificări Toast** - Sistem modern de notificări în timp real  
- ✅ **Loading States** - Indicatori vizuali pentru toate operațiunile
- ✅ **Error Handling** - Gestionare elegantă a erorilor cu mesaje clare
- ✅ **Backend Monitoring** - Status în timp real al conectivității

### 🎨 **Design Modern**
- ✅ **UI/UX Professional** - Design modern cu gradienturi și animații
- ✅ **Responsive Design** - Funcționează perfect pe toate dispositivele
- ✅ **CSS Variables** - Sistem consistent de culori și spațiere
- ✅ **Micro-interactions** - Hover effects și tranziții fluide

## 📋 **Prerequizite**

- **Node.js** >= 16.x
- **npm** >= 8.x
- **Backend Smart Parking** (trebuie să ruleze pe portul 3000)

## 🚀 **Instalare și Configurare**

### 1. **Clonează repository-ul**
```bash
git clone <repository-url>
cd smartparking-frontend
```

### 2. **Instalează dependențele**
```bash
npm install
```

### 3. **Configurează environment-ul**
```bash
# Copiază fișierul de configurare
cp .env.example .env

# Editează .env cu setările tale
REACT_APP_API_BASE_URL=http://localhost:3000
REACT_APP_ENV=development
```

### 4. **Pornește aplicația**
```bash
npm start
```

Aplicația se va deschide automat la [http://localhost:3001](http://localhost:3001)

## 🏗️ **Structura Proiectului**

```
src/
├── components/           # Componente reutilizabile
│   ├── BackendStatus.js    # Monitorizare status backend
│   ├── LoadingSpinner.js   # Spinner-e de încărcare
│   ├── Toast.js           # Sistem de notificări
│   ├── ReservationModal.js # Modal pentru rezervări
│   └── ProtectedRoute.js   # Protecția rutelor
├── context/             # Context providers
│   ├── AuthContext.js     # Gestionare autentificare
│   └── ToastContext.js    # Gestionare notificări
├── pages/               # Pagini principale
│   ├── Dashboard.js       # Pagina principală
│   ├── Login.js          # Pagina de login
│   └── Register.js       # Pagina de înregistrare
├── utils/               # Utilități
│   └── apiClient.js      # Client API cu error handling
├── App.js               # Componenta principală
├── App.css              # Stiluri globale cu variabile CSS
└── index.js             # Entry point
```

## 🎯 **Scripturi Disponibile**

### `npm start`
Pornește aplicația în modul dezvoltare pe [http://localhost:3001](http://localhost:3001)

### `npm test`
Rulează testele în modul interactiv

### `npm run build`
Construiește aplicația pentru producție în folderul `build/`

### `npm run eject`
⚠️ **Operație ireversibilă!** Extrage configurația pentru customizare avansată

## 🔧 **Configurare Backend**

Pentru ca aplicația să funcționeze corect, backend-ul trebuie să ruleze pe portul **3000** și să expună următoarele endpoint-uri:

```
GET    /api/health                     # Health check
GET    /api/parcare-completa/1         # Date complete parcare
POST   /api/auth/login                 # Autentificare
POST   /api/auth/register              # Înregistrare
GET    /api/user/{id}/vehicule         # Vehiculele utilizatorului
POST   /api/user/vehicule              # Adăugare vehicul
GET    /api/user/{id}/abonamente       # Abonamentele utilizatorului
POST   /api/user/abonamente            # Cumpărare abonament
GET    /api/tarife/abonamente          # Tarifele disponibile
PUT    /api/locuri/{id}/simulare       # Simulare parcare
POST   /api/locuri/{id}/rezervare      # Rezervare loc
```

## 🐛 **Debugging și Troubleshooting**

### **Backend Deconectat**
Dacă vezi o bară roșie în partea de sus, înseamnă că backend-ul nu este disponibil:

1. ✅ Verifică că backend-ul rulează: `npm start` în directorul backend
2. ✅ Testează endpoint-ul: http://localhost:3000/api/health
3. ✅ Verifică portul în `.env`: `REACT_APP_API_BASE_URL=http://localhost:3000`
4. ✅ Verifică logs-urile în Console (F12)

### **Erori comune**
- **"Module not found"** → Rulează `npm install`
- **"Port already in use"** → Frontend rulează pe 3001, backend pe 3000
- **"CORS errors"** → Verifică configurarea CORS în backend

## 🎨 **Personalizare Design**

Aplicația folosește **CSS Custom Properties** pentru personalizare ușoară:

```css
:root {
  --color-primary: #2563eb;        /* Culoarea principală */
  --color-success: #10b981;        /* Verde pentru succes */
  --color-danger: #ef4444;         /* Roșu pentru erori */
  --spacing-md: 1rem;              /* Spațiere medium */
  --radius-lg: 0.5rem;             /* Border radius mare */
  --shadow-xl: ...;                /* Umbra mare */
}
```

## 🤝 **Contribuție**

1. Fork repository-ul
2. Creează o branch pentru feature: `git checkout -b feature/NumeFeature`
3. Commit modificările: `git commit -m 'Add NumeFeature'`
4. Push pe branch: `git push origin feature/NumeFeature`
5. Deschide un Pull Request

## 📄 **Licență**

Acest proiect este sub licența MIT. Vezi fișierul `LICENSE` pentru detalii.

---

**Dezvoltat cu ❤️ folosind React și tehnologii moderne**

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
