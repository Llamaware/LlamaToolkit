using Jering.Javascript.NodeJS;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Text;

namespace LlamaToolkit
{
    internal class Program
    {
        static async Task Main(string[] args)
        {
            string firstLine;
            if (args.Length < 1)
            {
                firstLine = "default";
            }
            else
            {
                firstLine = args[0].ToLower();
            }
            var watch = Stopwatch.StartNew();
            switch (firstLine)
            {
                case "decrypt":
                    await Decrypt(args);
                    break;
                case "dedrm":
                    DeDRM(args);
                    break;
                case "redrm":
                    ReDRM(args);
                    break;
                case "extract":
                    Extract(args);
                    break;
                case "restore":
                    Restore(args);
                    break;
                case "deob":
                    await Deobfuscate(args);
                    break;
                case "autopwn":
                    await Autopwn(args);
                    break;
                default:
                    Console.WriteLine("LlamaToolkit 2.0 for TCAL version 2.0.10");
                    Console.WriteLine("Usage: LlamaToolkit <mode> <arguments>");
                    Console.WriteLine("Modes: decrypt, dedrm, redrm, autopwn, extract, restore, deob");
                    Console.WriteLine("Decryption: LlamaToolkit decrypt <inputFileOrDir> <outputDir>");
                    Console.WriteLine("DeDRM: LlamaToolkit dedrm <gameDir>");
                    Console.WriteLine("ReDRM: LlamaToolkit redrm <gameDir>");
                    Console.WriteLine("Autopwn: LlamaToolkit autopwn <gameDir>");
                    Console.WriteLine("If no arguments are provided, LlamaToolkit will assume it is inside of the game directory (containing game.exe).");
                    Console.WriteLine("---MANUAL DEOBFUSCATION TOOLS---");
                    Console.WriteLine("Extract: LlamaToolkit extract <gameDir>");
                    Console.WriteLine("Restore: LlamaToolkit restore <gameDir>");
                    Console.WriteLine("Deobfuscate: LlamaToolkit deob <inputFile>");
                    break;
            }
            watch.Stop();
            var elapsedMs = watch.ElapsedMilliseconds;
            Console.WriteLine("All tasks finished in " + elapsedMs + " ms.");
        }

        static bool CheckGameDirectory(string folder)
        {
            string game = Path.Combine(folder, "Game.exe");
            string nw = Path.Combine(folder, "nw.exe");
            bool inGameDir = (File.Exists(game) || File.Exists(nw));
            return inGameDir;
        }
        static bool CheckDRM(string folder)
        {
            string greenworks = Path.Combine(folder, "www", "greenworks", "greenworks.bak");
            return File.Exists(greenworks);
        }

        static bool CheckCoreEngine(string folder)
        {
            string coreEngine = Path.Combine(folder, "www", "js", "plugins", "NonCombatMenu.bak");
            return File.Exists(coreEngine);
        }

        static void DeDRM(string[] args)
        {
            string pathToGreenworks;
            string pathToBackup;
            string currentDir = Directory.GetCurrentDirectory();
            string replacementFile = Path.Combine(currentDir, "llama", "greenworks.js");
            if (args.Length == 2)
            {
                string userIn = args[1];
                bool valid = (CheckGameDirectory(userIn) && !CheckDRM(userIn) && File.Exists(replacementFile));
                if (valid)
                {
                    pathToGreenworks = Path.Combine(userIn, "www", "greenworks", "greenworks.js");
                    pathToBackup = Path.Combine(userIn, "www", "greenworks", "greenworks.bak");
                    File.Move(pathToGreenworks, pathToBackup);
                    File.Copy(replacementFile, pathToGreenworks);
                    Console.WriteLine("DRM removed.");
                }
                else
                {
                    Console.WriteLine("Error: Game not found, or DRM was already removed!");
                }
            }
            else
            {
                bool valid = (CheckGameDirectory(currentDir) && !CheckDRM(currentDir) && File.Exists(replacementFile));
                if (valid)
                {
                    pathToGreenworks = Path.Combine(currentDir, "www", "greenworks", "greenworks.js");
                    pathToBackup = Path.Combine(currentDir, "www", "greenworks", "greenworks.bak");
                    File.Move(pathToGreenworks, pathToBackup);
                    File.Copy(replacementFile, pathToGreenworks);
                    Console.WriteLine("DRM removed.");
                }
                else
                {
                    Console.WriteLine("Error: Game not found, or DRM was already removed!");
                }
            }
        }

        static void ReDRM(string[] args)
        {
            string pathToGreenworks;
            string pathToBackup;
            string currentDir = Directory.GetCurrentDirectory();
            string replacementFile = Path.Combine(currentDir, "www", "greenworks", "greenworks.bak");
            if (args.Length == 2)
            {
                string userIn = args[1];
                bool valid = (CheckGameDirectory(userIn) && CheckDRM(userIn) && File.Exists(replacementFile));
                if (valid)
                {
                    pathToGreenworks = Path.Combine(userIn, "www", "greenworks", "greenworks.js");
                    pathToBackup = Path.Combine(userIn, "www", "greenworks", "greenworks.bak");
                    File.Delete(pathToGreenworks);
                    File.Move(pathToBackup, pathToGreenworks);
                    Console.WriteLine("DRM restored.");
                }
                else
                {
                    Console.WriteLine("Error: Game not found, or DRM is already present!");
                }
            }
            else
            {
                bool valid = (CheckGameDirectory(currentDir) && CheckDRM(currentDir) && File.Exists(replacementFile));
                if (valid)
                {
                    pathToGreenworks = Path.Combine(currentDir, "www", "greenworks", "greenworks.js");
                    pathToBackup = Path.Combine(currentDir, "www", "greenworks", "greenworks.bak");
                    File.Delete(pathToGreenworks);
                    File.Move(pathToBackup, pathToGreenworks);
                    Console.WriteLine("DRM restored.");
                }
                else
                {
                    Console.WriteLine("Error: Game not found, or DRM is already present!");
                }
            }
        }

        static void Extract(string[] args)
        {
            string pathToCoreEngine;
            string pathToBackup;
            string pathToSearchText;
            string currentDir = Directory.GetCurrentDirectory();
            string replacementFile = Path.Combine(currentDir, "llama", "extractor.js");
            if (args.Length == 2)
            {
                string userIn = args[1];
                bool valid = (CheckGameDirectory(userIn) && !CheckCoreEngine(userIn) && File.Exists(replacementFile));
                if (valid)
                {
                    pathToCoreEngine = Path.Combine(userIn, "www", "js", "plugins", "NonCombatMenu.js");
                    pathToBackup = Path.Combine(userIn, "www", "js", "plugins", "NonCombatMenu.bak");
                    pathToSearchText = Path.Combine(userIn, "llama", "search.txt");
                    string[] target = File.ReadAllLines(pathToCoreEngine);
                    string searchText = File.ReadAllText(pathToSearchText);
                    File.Move(pathToCoreEngine, pathToBackup);
                    int targetIndex = Array.FindIndex(target, line => line.Contains(searchText));

                    if (targetIndex >= 0)
                    {
                        int lineToDeleteIndex = targetIndex + 5;
                        if (lineToDeleteIndex < target.Length)
                        {
                            Array.Copy(target, lineToDeleteIndex + 1, target, lineToDeleteIndex, target.Length - lineToDeleteIndex - 1);
                            Array.Resize(ref target, target.Length - 1);
                            string[] extractor = File.ReadAllLines(replacementFile);
                            Array.Resize(ref target, target.Length + extractor.Length);
                            Array.Copy(target, lineToDeleteIndex, target, lineToDeleteIndex + extractor.Length, target.Length - lineToDeleteIndex - extractor.Length);
                            Array.Copy(extractor, 0, target, lineToDeleteIndex, extractor.Length);
                            File.WriteAllLines(pathToCoreEngine, target);
                            Console.WriteLine("Extractor injected. Game will dump obfuscated code on next startup.");
                        }
                        else
                        {
                            Console.WriteLine("Error: Not enough lines after the target line to delete and replace.");
                        }
                    }
                    else
                    {
                        Console.WriteLine("Error: Target line not found!");
                    }
                }
                else
                {
                    Console.WriteLine("Error: Game not found, or extractor was already installed!");
                }
            }
            else
            {
                bool valid = (CheckGameDirectory(currentDir) && !CheckCoreEngine(currentDir) && File.Exists(replacementFile));
                if (valid)
                {
                    pathToCoreEngine = Path.Combine(currentDir, "www", "js", "plugins", "NonCombatMenu.js");
                    pathToBackup = Path.Combine(currentDir, "www", "js", "plugins", "NonCombatMenu.bak");
                    pathToSearchText = Path.Combine(currentDir, "llama", "search.txt");
                    string[] target = File.ReadAllLines(pathToCoreEngine);
                    string searchText = File.ReadAllText(pathToSearchText);
                    File.Move(pathToCoreEngine, pathToBackup);
                    int targetIndex = Array.FindIndex(target, line => line.Contains(searchText));

                    if (targetIndex >= 0)
                    {
                        int lineToDeleteIndex = targetIndex + 5;
                        if (lineToDeleteIndex < target.Length)
                        {
                            Array.Copy(target, lineToDeleteIndex + 1, target, lineToDeleteIndex, target.Length - lineToDeleteIndex - 1);
                            Array.Resize(ref target, target.Length - 1);
                            string[] extractor = File.ReadAllLines(replacementFile);
                            Array.Resize(ref target, target.Length + extractor.Length);
                            Array.Copy(target, lineToDeleteIndex, target, lineToDeleteIndex + extractor.Length, target.Length - lineToDeleteIndex - extractor.Length);
                            Array.Copy(extractor, 0, target, lineToDeleteIndex, extractor.Length);
                            File.WriteAllLines(pathToCoreEngine, target);
                            Console.WriteLine("Extractor injected. Game will dump obfuscated code on next startup.");
                        }
                        else
                        {
                            Console.WriteLine("Error: Not enough lines after the target line to delete and replace.");
                        }
                    }
                    else
                    {
                        Console.WriteLine("Error: Target line not found!");
                    }
                }
                else
                {
                    Console.WriteLine("Error: Game not found, or extractor was already installed!");
                }
            }
        }

        static void Restore(string[] args)
        {
            string pathToCoreEngine;
            string pathToBackup;
            string currentDir = Directory.GetCurrentDirectory();
            string replacementFile;
            if (args.Length == 2)
            {
                string userIn = args[1];
                replacementFile = Path.Combine(userIn, "www", "js", "plugins", "NonCombatMenu.bak");
                bool valid = (CheckGameDirectory(userIn) && CheckCoreEngine(userIn));
                if (valid)
                {
                    pathToCoreEngine = Path.Combine(userIn, "www", "js", "plugins", "NonCombatMenu.js");
                    pathToBackup = Path.Combine(userIn, "www", "js", "plugins", "NonCombatMenu.bak");
                    File.Delete(pathToCoreEngine);
                    File.Move(pathToBackup, pathToCoreEngine);
                    Console.WriteLine("Extractor removed from game.");
                }
                else if (!CheckGameDirectory(userIn))
                {
                    Console.WriteLine("Error: Game not found!");
                }
                else if (!CheckCoreEngine(userIn))
                {
                    Console.WriteLine("Error: Extractor was not installed!");
                }
            }
            else
            {
                replacementFile = Path.Combine(currentDir, "www", "js", "plugins", "NonCombatMenu.bak");
                bool valid = (CheckGameDirectory(currentDir) && CheckCoreEngine(currentDir));
                if (valid)
                {
                    pathToCoreEngine = Path.Combine(currentDir, "www", "js", "plugins", "NonCombatMenu.js");
                    pathToBackup = Path.Combine(currentDir, "www", "js", "plugins", "NonCombatMenu.bak");
                    File.Delete(pathToCoreEngine);
                    File.Move(pathToBackup, pathToCoreEngine);
                    Console.WriteLine("Extractor removed from game.");
                }
                else if (!CheckGameDirectory(currentDir))
                {
                    Console.WriteLine("Error: Game not found!");
                }
                else if (!CheckCoreEngine(currentDir))
                {
                    Console.WriteLine("Error: Extractor was not installed!");
                }
            }
        }

        static void DecryptionFailure(string userIn)
        {
            Console.WriteLine("Decryption failed. File was NOT decrypted: " + userIn);
        }
        static async Task Decrypt(string[] args)
        {
            if (args.Length == 3)
            {
                string userIn = args[1];
                string dirOutput = args[2];
                if (File.Exists(userIn))
                {
                    byte[] rawData = File.ReadAllBytes(userIn);
                    string fileExtension = GetFileExtension(rawData);
                    byte[] decryptedFile = DecryptFile(rawData, userIn);
                    if (decryptedFile.Length == 1)
                    {
                        DecryptionFailure(userIn);
                    }
                    else
                    {
                        string decryptedFilename = Path.Combine(dirOutput, Path.GetFileName(userIn));
                        string? directoryToCreate = Path.GetDirectoryName(decryptedFilename);
                        if (directoryToCreate != null)
                        {
                            Directory.CreateDirectory(directoryToCreate);
                        }
                        string newFilename = Path.ChangeExtension(decryptedFilename, fileExtension);
                        File.WriteAllBytes(newFilename, decryptedFile);
                        Console.WriteLine("Single file decrypted and saved to: " + newFilename);
                    }
                }
                else if (Directory.Exists(userIn))
                {
                    Console.WriteLine("Processing directory: " + userIn);
                    await DecryptFolder(userIn, dirOutput);
                }
                else
                {
                    Console.WriteLine("Error: File or directory does not exist: " + userIn);
                }
            }
            else
            {
                string currentDir = Directory.GetCurrentDirectory();
                if (CheckGameDirectory(currentDir))
                {
                    string[] dirInputs = [Path.Combine("www", "img"), Path.Combine("www", "audio"), Path.Combine("www", "data")];
                    string dirOutput = "decrypted";
                    IList<Task> folderTaskList = new List<Task>();
                    foreach (string folder in dirInputs)
                    {
                        string fullFolderPath = Path.Combine(Directory.GetCurrentDirectory(), folder);
                        if (Directory.Exists(fullFolderPath))
                        {
                            Console.WriteLine("Processing directory: " + folder);
                            folderTaskList.Add(DecryptFolder(fullFolderPath, dirOutput));
                        }
                        else
                        {
                            Console.WriteLine("Error: Directory does not exist: " + folder);
                        }
                    }
                    await Task.WhenAll(folderTaskList);
                }
                else
                {
                    Console.WriteLine("Error: Game not found!");
                }
            }
        }

        static async Task Deobfuscate(string[] args)
        {
            string filename;
            if (args.Length != 2)
            {
                Console.WriteLine("Usage: LlamaToolkit deob <inputFile>");
                Console.WriteLine("Example: LlamaToolkit deob input.js");
                Console.WriteLine("The processed script will be put into output.js.");
                return;
            }
            else
            {
                filename = args[1];
            }

            Console.WriteLine("Starting deobfuscation.");
            string currentDir = Directory.GetCurrentDirectory();
            string jsModule = Path.Combine(currentDir, "llama", "decode-js", "src", "plugin", "obfuscator2.js");

            var services = new ServiceCollection();

            services.AddNodeJS();
            services.Configure<NodeJSProcessOptions>(options => options.ProjectPath = currentDir);
            services.AddLogging(opt =>
            {
                opt.SetMinimumLevel(LogLevel.Information)
                   .AddSimpleConsole();
            });
            StaticNodeJSService.SetServices(services);

            string script = File.ReadAllText(filename);

            string? result = await StaticNodeJSService.InvokeFromFileAsync<string>(jsModule, args: new[] { script });

            string output = "output.js";
            File.WriteAllText(output, result);
            Console.WriteLine("File written to output.js.");
        }

        static async Task Autopwn(string[] args)
        {
            Console.WriteLine("Starting autopwn.");
            string currentDir = Directory.GetCurrentDirectory();
            string pathToGameExe;
            string pathToInput;
            if (args.Length == 2)
            {
                string userIn = args[1];
                if (CheckGameDirectory(userIn))
                {
                    pathToGameExe = Path.Combine(userIn, "Game.exe");
                    pathToInput = Path.Combine(userIn, "input.js");
                }
                else
                {
                    Console.WriteLine("Error: Game not found!");
                    return;
                }
            }
            else
            {
                if (CheckGameDirectory(currentDir))
                {
                    pathToGameExe = Path.Combine(currentDir, "Game.exe");
                    pathToInput = Path.Combine(currentDir, "input.js");
                }
                else
                {
                    Console.WriteLine("Error: Game not found!");
                    return;
                }
            }
            Extract(args);
            using (Process myProcess = Process.Start(pathToGameExe))
            {
                Thread.Sleep(3000);
                myProcess.CloseMainWindow();
                myProcess.Close();
            }
            Restore(args);
            string[] input = ["hoge", pathToInput];
            await Deobfuscate(input);
            Console.WriteLine("Autopwn completed.");
        }

        static async Task DecryptFolder(string dirInput, string dirOutput)
        {
            string[] fileList = GetFiles(dirInput, "*.k9a", SearchOption.AllDirectories);
            IList<Task> writeTaskList = new List<Task>();
            foreach (string f in fileList)
            {
                byte[] rawData = await File.ReadAllBytesAsync(f);
                string fileExtension = GetFileExtension(rawData);
                byte[] decryptedFile = DecryptFile(rawData, f);
                if (decryptedFile.Length == 1)
                {
                    DecryptionFailure(f);
                }
                else
                {
                    string decryptedFilename = Path.Combine(dirOutput, Path.GetRelativePath(Directory.GetCurrentDirectory(), f));
                    string? directoryToCreate = Path.GetDirectoryName(decryptedFilename);
                    if (directoryToCreate != null)
                    {
                        await Task.Run(() => Directory.CreateDirectory(directoryToCreate));
                    }
                    string newFilename = Path.ChangeExtension(decryptedFilename, fileExtension);
                    writeTaskList.Add(File.WriteAllBytesAsync(newFilename, decryptedFile));
                    Console.WriteLine("File decrypted and saved to: " + newFilename);
                }
            }
            await Task.WhenAll(writeTaskList);
        }

        static string GetFileExtension(byte[] data)
        {
            int headerLength = data[0];
            return Encoding.ASCII.GetString(data, 1, headerLength);
        }
        static int Mask(string inputString)
        {
            int maskValue = 0;
            string decodedFilename = Path.GetFileNameWithoutExtension(inputString).ToUpper();
            foreach (char c in decodedFilename)
            {
                maskValue = (maskValue << 1) ^ c;
            }
            return maskValue;
        }
        static byte[] DecryptFile(byte[] data, string url)
        {
            if (!url.EndsWith(".k9a"))
            {
                Console.WriteLine("Not a .k9a file, skipping...");
                byte[] empty = { 0 };
                return empty;
            }

            int headerLength = data[0];
            int dataLength = data[1 + headerLength];
            byte[] encryptedData = new byte[data.Length - 2 - headerLength];
            Array.Copy(data, 2 + headerLength, encryptedData, 0, encryptedData.Length);
            int newMask = Mask(url);

            if (dataLength == 0)
            {
                dataLength = encryptedData.Length;
            }

            byte[] decryptedData = encryptedData;

            for (int i = 0; i < dataLength; i++)
            {
                byte encryptedByte = encryptedData[i];
                decryptedData[i] = (byte)((encryptedByte ^ newMask) % 256);
                newMask = newMask << 1 ^ encryptedByte;
            }

            return decryptedData;
        }
        static string[] GetFiles(string sourceFolder, string filters, SearchOption searchOption)
        {
            return filters.Split('|').SelectMany(filter => Directory.GetFiles(sourceFolder, filter, searchOption)).ToArray();
        }
    }
}
