import React, { useState } from 'react';

const Navbar = () => {
    const [isFileMenuOpen, setFileMenuOpen] = useState(false);

    const handleNewFile = () => {
        console.log('New File created!');
        // Logic for creating a new file
    };

    const handleNewTextFile = () => {
        console.log('New Text File created!');
        // Logic for creating a new text file
    };

    const handleOpenFile = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                console.log(`Opened file: ${file.name}`);
            }
        };
        input.click();
    };

    const handleOpenFolder = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true; // Enables folder selection
        input.onchange = (e) => {
            const folder = e.target.files;
            if (folder.length) {
                console.log('Opened folder:', folder);
            }
        };
        input.click();
    };

    return (
        <div style={styles.navbar}>
            <div
                style={styles.menuItem}
                onClick={() => setFileMenuOpen(!isFileMenuOpen)}
            >
                File
                {isFileMenuOpen && (
                    <div style={styles.dropdownMenu}>
                        <div style={styles.dropdownItem} onClick={handleNewFile}>
                            New File
                        </div>
                        <div
                            style={styles.dropdownItem}
                            onClick={handleNewTextFile}
                        >
                            New Text File
                        </div>
                        <div style={styles.dropdownItem} onClick={handleOpenFile}>
                            Open File
                        </div>
                        <div
                            style={styles.dropdownItem}
                            onClick={handleOpenFolder}
                        >
                            Open Folder
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    navbar: {
        backgroundColor: '#282c34',
        color: 'white',
        display: 'flex',
        padding: '10px 20px',
        alignItems: 'center',
    },
    menuItem: {
        position: 'relative',
        cursor: 'pointer',
        marginRight: '20px',
    },
    dropdownMenu: {
        position: 'absolute',
        top: '30px',
        left: '0',
        backgroundColor: '#333',
        color: 'white',
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
        borderRadius: '4px',
        overflow: 'hidden',
        zIndex: 1000,
    },
    dropdownItem: {
        padding: '10px 20px',
        cursor: 'pointer',
        borderBottom: '1px solid #444',
    },
    dropdownItemLast: {
        padding: '10px 20px',
        cursor: 'pointer',
    },
};

export default Navbar;
