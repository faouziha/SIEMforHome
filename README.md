# DevSec | Home Network SIEM & Topology Monitor

A Full-Stack Security Information and Event Management (SIEM) dashboard designed for active home network reconnaissance. This project automates device discovery, detects open ports and vulnerabilities, calculates network risk scores, and visualizes the network in a live, interactive 2D topology map.

---

## 🚀 Key Features

* **Active Reconnaissance:** Trigger Nmap scans directly from the React dashboard to discover active nodes, open ports, and running services.
* **Live Topology Mapping:** A dynamic, physics-based 2D network map that visually highlights vulnerable devices with glowing red alerts.
* **Risk Assessment Engine:** Automatically calculates a global network risk score based on the severity and quantity of discovered vulnerabilities.
* **Asset Inventory:** Maintains a PostgreSQL database of all historical and active devices on the network.
* **Cyber-Aesthetic UI:** Fully responsive, dark-mode terminal UI built with Tailwind CSS.
* **Dynamic Geolocation:** Auto-detects the network's public IP location for real-time situational awareness.

---

## 🧰 Tech Stack

### Frontend (Client)

* React.js (Vite)
* Tailwind CSS
* react-force-graph-2d
* Axios

### Backend (Server)

* Python / Django
* Django REST Framework
* PostgreSQL

### Core Scanning Engines

* Nmap (Network Mapper)
* TShark (Terminal Wireshark)

---

## 📁 Project Structure

```
SIEM_FOR_HOME_NETWORK/
├── Client/                 # React frontend application
│   ├── package.json
│   ├── src/
│   └── .gitignore
├── server/                 # Django backend application
│   ├── .venv
│   ├── SIEMproject/
      ├── SIEMproject/
│     ├── SIEMapp/
│     └── .gitignore
└── README.md
```

---

## ⚙️ System Requirements

Before setting up the software, install the following tools and ensure they are added to your system PATH:

### 1. Nmap (Network Mapper)

* **Windows:** Download and install from https://nmap.org
* **Linux (Ubuntu/Debian):**

  ```bash
  sudo apt install nmap
  ```
* **macOS:**

  ```bash
  brew install nmap
  ```

---

### 2. TShark / Wireshark

* **Windows:** Install Wireshark from https://www.wireshark.org (includes TShark)
* **Linux (Ubuntu/Debian):**

  ```bash
  sudo apt install tshark
  ```
* **macOS:**

  ```bash
  brew install wireshark
  ```

---

## 🛠️ Installation and Setup Guide

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/SIEM_FOR_HOME_NETWORK.git
cd SIEM_FOR_HOME_NETWORK
```

---

### 2. Backend Setup (Django)

```bash
cd server

# Create virtual environment
python -m venv venv

# Activate virtual environment

# Windows:
venv\Scripts\activate

# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

### 🔐 Environment Configuration

Create a `.env` file inside the `server/` folder:

```
DB_NAME=siem_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=your_django_secret_key
```

---

### 🗄️ Database Initialization

```bash
python manage.py migrate
python manage.py runserver
```

Backend will be live at:
👉 http://127.0.0.1:8000

---

### 3. Frontend Setup (React)

Open a new terminal:

```bash
cd Client
npm install
npm run dev
```

Frontend will be live at:
👉 http://localhost:5173

---

## 🧪 Usage Instructions

1. Open http://localhost:5173 in your browser
2. Navigate to the **Vulnerability Scanner** page
3. Click **RUN FULL RECON** to begin scanning
4. View results in:

   * **Network Topology** → Interactive graph
   * **Dashboard** → Risk score & alerts

---

## 🔧 Troubleshooting

* Ensure **Nmap** and **TShark** are installed and accessible via PATH
* Verify PostgreSQL is running and credentials are correct
* If ports are blocked, try running backend with admin/root privileges
* On Linux, you may need:

  ```bash
  sudo usermod -aG wireshark $USER
  ```
* Restart terminal after installing dependencies

---

## 📌 Future Improvements

* Real-time packet anomaly detection
* AI-based threat classification
* Alert notifications (Email / Telegram)
* Role-based authentication system
* Historical attack visualization

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new branch (`feature/your-feature`)
3. Commit your changes
4. Push to your fork
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License.

---

## ⚠️ Disclaimer

**For Educational and Authorized Use Only**

This tool utilizes Nmap and TShark for network auditing. Only run this software on networks you own or have explicit permission to audit.

The developers are not responsible for any misuse or damage caused by this software.

---
