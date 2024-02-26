using Microsoft.ClearScript.V8;
using System.Text.RegularExpressions;

namespace LlamaToolkit
{
    internal class Program
    {
        static void Main(string[] args)
        {
            string firstLine = args[0];
            var watch = System.Diagnostics.Stopwatch.StartNew();
            switch (firstLine)
            {
                case "decrypt":
                    Decrypt(args);
                    break;
                case "dedrm":
                    DeDRM(args);
                    break;
                case "deob":
                    Deobfuscate(args);
                    break;
                default:
                    Console.WriteLine("Usage: LlamaToolkit <mode> <arguments>");
                    Console.WriteLine("Modes: decrypt, dedrm, deob");
                    Console.WriteLine("Decryption: LlamaToolkit decrypt <inputFileOrDir> <outputDir>");
                    Console.WriteLine("DeDRM: LlamaToolkit dedrm <gameFolder>");
                    Console.WriteLine("If no arguments are provided, LlamaToolkit will assume it is inside of the game directory (containing game.exe).");
                    Console.WriteLine("Deobfuscate: LlamaToolkit deob <func> <in hdr file> <in dtl file>");
                    Console.WriteLine("You must run the code through obf-io.deobfuscate.io before processing it with LlamaToolkit. See README for details.");
                    break;
            }
            watch.Stop();
            var elapsedMs = watch.ElapsedMilliseconds;
            Console.WriteLine("All tasks finished in " + elapsedMs + " ms.");
        }

        static bool CheckGameDirectory(string folder)
        {
            string game = Path.Combine(folder, "game.exe");
            string nw = Path.Combine(folder, "nw.exe");
            bool inGameDir = (File.Exists(game) || File.Exists(nw));
            return inGameDir;
        }
        static bool CheckDRM(string folder)
        {
            string greenworks = Path.Combine(folder, "www", "greenworks", "greenworks.bak");
            return File.Exists(greenworks);
        }

        static void DeDRM(string[] args)
        {
            string userIn;
            string pathToGreenworks;
            string pathToBackup;
            string currentDir = Directory.GetCurrentDirectory();
            string replacementFile = Path.Combine(currentDir, "llama", "greenworks.js");
            if (args.Length == 2)
            {
                userIn = args[1];
                bool valid = (CheckGameDirectory(userIn) && !CheckDRM(userIn));
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
                bool valid = (CheckGameDirectory(currentDir) && !CheckDRM(currentDir));
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
        static void DecryptionFailure(string userIn)
        {
            Console.WriteLine("Error: Decoded signature doesn't match file header! Is the key wrong or the input file not encrypted?");
            Console.WriteLine("Decryption aborted. File was NOT decrypted: " + userIn);
        }
        static void Decrypt(string[] args)
        {
            if (args.Length == 3)
            {
                string userIn = args[1];
                string dirOutput = args[2];
                if (File.Exists(userIn))
                {
                    byte[] rawData = File.ReadAllBytes(userIn);
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
                        File.WriteAllBytes(decryptedFilename, decryptedFile);
                        Console.WriteLine("Single file decrypted and saved to: " + decryptedFilename);
                    }
                }
                else if (Directory.Exists(userIn))
                {
                    DecryptFolder(userIn, dirOutput);
                    Console.WriteLine("Directory processed: " + userIn);
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
                    foreach (string folder in dirInputs)
                    {
                        string fullFolderPath = Path.Combine(Directory.GetCurrentDirectory(), folder);
                        if (Directory.Exists(fullFolderPath))
                        {
                            DecryptFolder(fullFolderPath, dirOutput);
                            Console.WriteLine("Directory processed: " + folder);
                        }
                        else
                        {
                            Console.WriteLine("Error: Directory does not exist: " + folder);
                        }
                    }
                }
                else
                {
                    Console.WriteLine("Error: Game not found!");
                }
            }
        }

        static void Deobfuscate(string[] args)
        {
            Console.WriteLine("JavaScript DeObfuscator by Script Replacement.");
            if (args == null || args.Length < 4)
            {
                Console.WriteLine("Usage: LlamaToolkit deob <func> <in hdr file> <in dtl file>");
                Console.WriteLine("Example: LlamaToolkit deob _0x59166b header.js detail.js");
                Console.WriteLine("_0x59166b -> function name to be replaced.");
                Console.WriteLine("header.js -> contains string initialize and function declaration.");
                Console.WriteLine("detail.js -> contains script to be replaced.");
                Console.WriteLine("The processed script will be put into <detail file name>-result.js.");
                return;
            }
            string sFunc = args[1];
            if (!File.Exists(args[2]))
            {
                Console.WriteLine("Error: File " + args[1] + " not found.");
                return;
            }
            string sHdrFile = args[2];
            if (!File.Exists(args[3]))
            {
                Console.WriteLine("Error: File " + args[3] + " not found.");
                return;
            }
            string sDtlFile = args[3];

            ProcessScript(sFunc, sHdrFile, sDtlFile);
        }

        static void ProcessScript(string sFunc, string sHdrFile, string sDtlFile)
        {
            string sFileResult = Path.GetFileNameWithoutExtension(sDtlFile) + "-result.js";
            string sHdrScript = File.ReadAllText(sHdrFile);
            string sRScript = File.ReadAllText(sDtlFile);

            V8ScriptEngine v8 = new V8ScriptEngine();
            V8Script myScript = v8.Compile(sHdrScript);
            v8.Execute(myScript);

            string sRegex = "(" + sFunc + @"\(0[xX][0-9A-Fa-f]+\))";
            MatchCollection arMatches = Regex.Matches(sRScript, sRegex);
            int nI;
            string sMatchVal, sRes;
            for (nI = 0; nI < arMatches.Count; nI++)
            {
                sMatchVal = arMatches[nI].Value;
                Console.WriteLine("Processing " + sMatchVal);
                sRes = v8.ExecuteCommand(sMatchVal);
                sRScript = sRScript.Replace(arMatches[nI].Value, ToLiteral(sRes));
            }
            v8.Dispose();

            Console.WriteLine("Converting hexadecimal numbers to decimal.");
            string pattern = @"(?<!_)(0x[0-9A-Fa-f]+)";
            MatchEvaluator evaluator = new MatchEvaluator(ConvertHexToDecimal);
            string replacedContent = Regex.Replace(sRScript, pattern, evaluator);

            File.WriteAllText(sFileResult, replacedContent);
            Console.WriteLine("Output file saved.");
            return;
        }

        static string ToLiteral(string valueTextForCompiler)
        {
            return Microsoft.CodeAnalysis.CSharp.SymbolDisplay.FormatLiteral(valueTextForCompiler, false);
        }

        static string ConvertHexToDecimal(Match match)
        {
            string hexNumber = match.Value;
            hexNumber = hexNumber.Substring(2);
            int decimalNumber = Convert.ToInt32(hexNumber, 16);
            return decimalNumber.ToString();
        }

        static void DecryptFolder(string dirInput, string dirOutput)
        {
            string[] fileList = GetFiles(dirInput, "*.png|*.ogg|*.json", SearchOption.AllDirectories);
            foreach (string f in fileList)
            {
                byte[] rawData = File.ReadAllBytes(f);
                byte[] decryptedFile = DecryptFile(rawData, f);
                if (decryptedFile.Length == 1)
                {
                    DecryptionFailure(f);
                }
                else
                {
                    string decryptedFilename = Path.Combine(dirOutput, Path.GetFileName(f));
                    string? directoryToCreate = Path.GetDirectoryName(decryptedFilename);
                    if (directoryToCreate != null)
                    {
                        Directory.CreateDirectory(directoryToCreate);
                    }
                    File.WriteAllBytes(decryptedFilename, decryptedFile);
                    Console.WriteLine("File decrypted and saved to: " + decryptedFilename);
                }
            }
        }
        static uint Mask(string inputString)
        {
            uint maskValue = 0;
            string decodedFilename = Path.GetFileNameWithoutExtension(inputString).ToUpper();
            foreach (char c in decodedFilename)
            {
                maskValue = (maskValue << 1) ^ c;
            }
            return maskValue;
        }
        static byte[] DecryptFile(byte[] inputData, string key)
        {
            uint maskValue = Mask(key);
            int signatureLength = Signature().Length;
            byte[] slicedInput = new byte[signatureLength];
            Buffer.BlockCopy(inputData, 0, slicedInput, 0, signatureLength);
            byte[] decodedChars = new byte[signatureLength];

            for (int i = 0; i < signatureLength; i++)
            {
                char c = Signature()[i];
                uint temp = (c ^ maskValue) % 0x100;
                decodedChars[i] = (byte)temp;
            }

            if (!Enumerable.SequenceEqual(slicedInput, decodedChars))
            {
                byte[] empty = [0];
                return empty;
            }

            byte[] remainingData = new byte[inputData.Length - signatureLength - 1];
            Buffer.BlockCopy(inputData, signatureLength + 1, remainingData, 0, remainingData.Length);

            byte zeroIndexValue = inputData[signatureLength];
            int decryptionLength = Convert.ToInt32(zeroIndexValue);

            if (zeroIndexValue == 0)
            {
                decryptionLength = remainingData.Length;
            }

            for (int i = 0; i < decryptionLength; i++)
            {
                byte temp = remainingData[i];
                uint decryptedByte = (remainingData[i] ^ maskValue) % 0x100;
                remainingData[i] = (byte)decryptedByte;
                maskValue = (maskValue << 1) ^ temp;
            }

            return remainingData;
        }
        static string[] GetFiles(string sourceFolder, string filters, SearchOption searchOption)
        {
            return filters.Split('|').SelectMany(filter => Directory.GetFiles(sourceFolder, filter, searchOption)).ToArray();
        }
        static string Signature()
        {
            string sig = "00000NEMLEI00000";
            return sig;
        }

    }
}
