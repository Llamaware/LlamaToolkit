import tkinter as tk
from tkinter import filedialog, messagebox
from tkinter import ttk
import subprocess
import os

class LlamaToolkitApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Awooochy's LlamaToolkit GUI")
        self.root.geometry("800x500")  # Adjust the size to be wider
        self.root.configure(bg='black')
        self.root.resizable(False, False)  # Make the window fixed size

        self.setup_file_path = tk.StringVar()

        self.create_tabs()

    def create_tabs(self):
        tab_control = ttk.Notebook(self.root, style='TNotebook')
        
        self.decryption_tab = ttk.Frame(tab_control, style='TFrame')
        self.setup_tab = ttk.Frame(tab_control, style='TFrame')
        
        tab_control.add(self.decryption_tab, text='Decryption')
        tab_control.add(self.setup_tab, text='Setup')
        tab_control.pack(expand=1, fill='both')

        self.create_decryption_tab()
        self.create_setup_tab()

    def create_decryption_tab(self):
        frame = ttk.Frame(self.decryption_tab, padding="10", style='TFrame')
        frame.pack(fill='both', expand=True)

        ttk.Label(frame, text="Select Input Folder:", style='TLabel').grid(row=0, column=0, sticky='w')
        self.input_path_entry = ttk.Entry(frame, width=60, style='TEntry')
        self.input_path_entry.grid(row=0, column=1, padx=5, pady=5)
        ttk.Button(frame, text="Browse Folder", command=self.browse_input_folder, style='TButton').grid(row=0, column=2, padx=5, pady=5)

        ttk.Label(frame, text="Output Directory:", style='TLabel').grid(row=1, column=0, sticky='w')
        self.output_path_entry = ttk.Entry(frame, width=60, style='TEntry')
        self.output_path_entry.grid(row=1, column=1, padx=5, pady=5)
        ttk.Button(frame, text="Browse", command=self.browse_output, style='TButton').grid(row=1, column=2, padx=5, pady=5)

        ttk.Button(frame, text="Decrypt", command=self.decrypt, style='TButton').grid(row=2, column=0, columnspan=3, pady=10)

    def create_setup_tab(self):
        frame = ttk.Frame(self.setup_tab, padding="10", style='TFrame')
        frame.pack(fill='both', expand=True)

        ttk.Label(frame, text="LlamaToolkit.exe Path:", style='TLabel').grid(row=0, column=0, sticky='w')
        self.setup_file_entry = ttk.Entry(frame, textvariable=self.setup_file_path, width=60, style='TEntry')
        self.setup_file_entry.grid(row=0, column=1, padx=5, pady=5)
        ttk.Button(frame, text="Browse", command=self.browse_setup_file, style='TButton').grid(row=0, column=2, padx=5, pady=5)

        ttk.Button(frame, text="Save Setup", command=self.save_setup, style='TButton').grid(row=1, column=0, columnspan=3, pady=10)

    def browse_input_folder(self):
        folder_path = filedialog.askdirectory(title="Select Input Folder")
        if folder_path:
            self.input_path_entry.delete(0, tk.END)
            self.input_path_entry.insert(0, folder_path)

    def browse_output(self):
        dir_path = filedialog.askdirectory(title="Select Output Directory")
        if dir_path:
            self.output_path_entry.delete(0, tk.END)
            self.output_path_entry.insert(0, dir_path)

    def browse_setup_file(self):
        file_path = filedialog.askopenfilename(title="Select LlamaToolkit.exe", filetypes=[("Executable Files", "*.exe")])
        if file_path:
            self.setup_file_path.set(file_path)

    def save_setup(self):
        setup_path = self.setup_file_path.get()
        if not setup_path:
            messagebox.showerror("Error", "Please select the LlamaToolkit.exe file.")
            return
        
        with open("setup_config.txt", "w") as file:
            file.write(setup_path)
        
        messagebox.showinfo("Setup Saved", "LlamaToolkit.exe path has been saved.")

    def decrypt(self):
        input_path = self.input_path_entry.get()
        output_path = self.output_path_entry.get()

        if not input_path or not output_path:
            messagebox.showerror("Error", "Please specify both input and output paths.")
            return

        setup_path = self.setup_file_path.get() or "LlamaToolkit.exe"
        
        if os.path.isdir(input_path):
            self.decrypt_folder(input_path, output_path, setup_path)
        else:
            command = [setup_path, "decrypt", input_path, output_path]
            try:
                subprocess.run(command, check=True)
                messagebox.showinfo("Success", "Decryption completed successfully.")
            except subprocess.CalledProcessError as e:
                messagebox.showerror("Error", f"An error occurred during decryption: {e}")

    def decrypt_folder(self, input_folder, output_folder, setup_path):
        if not os.path.exists(output_folder):
            os.makedirs(output_folder)
        
        for root, dirs, files in os.walk(input_folder):
            for file in files:
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, input_folder)
                output_file_path = os.path.join(output_folder, relative_path)

                # Ensure the directory exists in the output path
                os.makedirs(os.path.dirname(output_file_path), exist_ok=True)

                # Run decryption command for each file
                command = [setup_path, "decrypt", file_path, output_file_path]
                try:
                    subprocess.run(command, check=True)
                    print(f"Decrypted {file_path} to {output_file_path}")
                except subprocess.CalledProcessError as e:
                    print(f"Error decrypting {file_path}: {e}")

        messagebox.showinfo("Success", "All files in the folder have been decrypted.")

if __name__ == "__main__":
    root = tk.Tk()
    
    # Define custom styles
    style = ttk.Style()
    style.configure('TFrame', background='black')
    style.configure('TLabel', background='black', foreground='magenta')
    style.configure('TButton', background='black', foreground='magenta', borderwidth=1, focuscolor='none')
    style.configure('TEntry', background='black', foreground='magenta', borderwidth=1)
    style.configure('TNotebook', background='black', borderwidth=0)
    style.configure('TNotebook.Tab', background='black', foreground='magenta', padding=[10, 5])
    style.map('TNotebook.Tab', background=[('selected', 'magenta')], foreground=[('selected', 'black')])
    
    app = LlamaToolkitApp(root)
    root.mainloop()
