# CodIt - Real-Time Code Editor

CodIt is a real-time collaborative code editor where users can create private rooms, invite friends, and code together live. It provides the ability to save and share code seamlessly. Inspired by Notepad, it offers a minimalistic yet powerful coding experience.

## Features

- **Private Rooms**: Create a private coding room and share the link with friends.
- **Real-Time Collaboration**: Work together with others in real-time using WebSockets.
- **Save & Share Code**: Store your code snippets for later use and share them easily.
- **Syntax Highlighting**: Enhance readability and improve coding efficiency.
- **MERN Stack + Socket.io**: Built using MongoDB, Express.js, React.js, Node.js, and Socket.io for real-time communication.

## Tech Stack

- **Frontend**: React.js, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Real-Time Communication**: Socket.io

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/CodIt.git
   cd CodIt
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd server
   npm install

   # Frontend
   cd ../client
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory and configure the following variables:
   ```env
   MONGO_URI=your_mongodb_connection_string
   ```

4. **Start the application**
   ```bash
   # Backend
   cd server
   npm start

   # Frontend
   cd ../client
   npm start
   ```

## Usage

- Open the app and create a private room.
- Share the unique room link with your friend.
- Start coding together in real-time.
- Save or share your code directly from the editor.

## Contributing

Contributions are welcome! Feel free to fork the repository and submit a pull request with your improvements.

## License

This project is licensed under the MIT License.

---

Happy Coding! 🚀
