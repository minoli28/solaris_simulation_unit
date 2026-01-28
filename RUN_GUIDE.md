# VS Code Operation Guide for Solaris Simulation Unit

## 1. Opening the Project
**Root Folder**: Open the following folder in VS Code:
`/Users/mrmo/Documents/My Files/Riipen Project/PHASE 1.3/Solaris_Simulation_Unit`

This ensures both the backend (`main.py`) and frontend (`frontend/`) are visible in your explorer.

## 2. Setting Up Prerequisites (One-Time Setup)

### Backend (Python)
Open a new terminal (`Terminal > New Terminal`) and run:
```bash
pip install -r requirements.txt
```

### Frontend (Node.js)
Open a separate terminal, navigate to the frontend folder, and install dependencies:
```bash
cd frontend
npm install
```

## 3. Starting the Localhost

You will need **two** separate terminal instances running side-by-side or in tabs.

### Terminal 1: Backend
1. Ensure you are in the root folder (`Solaris_Simulation_Unit`).
2. Run the startup command:
```bash
python3 main.py
```
*   **Success Indicator**: You will see "Uvicorn running on http://0.0.0.0:8000".

### Terminal 2: Frontend
1. Navigate to the frontend folder:
```bash
cd frontend
```
2. Start the development server:
```bash
npm run dev
```
*   **Success Indicator**: You will see "Local: http://localhost:5173/".

## 4. Accessing the App
*   **Web Interface**: Open [http://localhost:5173](http://localhost:5173) in your browser.
*   **API Docs**: Open [http://localhost:8000/docs](http://localhost:8000/docs) to test the backend directly.

## 5. Stopping the Localhost
To stop the servers, go to the respective terminal for each process:
1. Click inside the terminal window.
2. Press **`Ctrl + C`** (Control key + C).
3. The process will terminate and return you to the command prompt.

REPEAT this for **both** the backend and frontend terminals to ensure everything is stopped.
