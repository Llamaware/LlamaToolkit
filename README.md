
# LlamaToolkit 2.0

A decompilation toolkit for The Coffin of Andy and Leyley. (Formerly IelmenDecryptor)

### Usage

Place the program and the `llama` folder in the main directory that contains `game.exe` and run LlamaToolkit from the command line.

```
LlamaToolkit <mode> <arguments>
```

### Decrypt

The filenames of all encrypted files must be unchanged.

Arguments:

`inputFileOrDir`: Specify the input directory or file. If directory, it will traverse all folders in the directory recursively.

`outputDir`: Specify the output directory.

You must pass both arguments at once. Both relative and absolute paths are supported.

If no arguments are provided, LlamaToolkit will only check the `audio`, `data`, and `img` folders in the game directory.

```
LlamaToolkit decrypt <inputFileOrDir> <outputDir>
```

### DeDRM

Allows the game to be launched without Steam.

Arguments:

`gameDir`: Specify the game directory.

If no arguments are provided, LlamaToolkit will assume that it is currently inside of the game directory.

```
LlamaToolkit dedrm <gameDir>
```

### Extract

Acquire the obfuscated game code by injecting a script into the game.

```
LlamaToolkit extract <gameDir>
```

The game will dump obfuscated code to a new file named `obfuscated.js` on the next startup.

### Deobfuscate (Manually)

Using any IDE, format the obfuscated code you obtained with the extractor.

Split the obfuscated code into two files. One file will be `header.js` containing the large string array and the rotating functions. The other file `detail.js` will contain the rest of the code, beginning from the line `use strict;`

Run the contents of `detail.js` through [Obfuscator.io Deobfuscator](https://obf-io.deobfuscate.io/).

Then run LlamaToolkit `deob` on both files, giving it the name of the replacement function (in this case, it's `_0x59166b`).

```
LlamaToolkit deob _0x59166b header.js detail.js
```

All calls to that function will be deobfuscated, and hexadecimal numbers will be replaced with decimal numbers. The new file will be saved to `detail-result.js`.

### ReDRM

Restore the DRM.

```
LlamaToolkit redrm <gameDir>
```

### Restore

Remove the code extractor from the game.

```
LlamaToolkit restore <gameDir>
```

### Credits

LlamaToolkit uses the `Microsoft.CodeAnalysis` and `Microsoft.ClearScript.V8` packages, which are licensed under the MIT License. [1](https://github.com/dotnet/roslyn/blob/main/License.txt), [2](https://github.com/microsoft/ClearScript/blob/master/License.txt)

The deobfuscator is based on [EPJsDeOb: JavaScript Deobfuscation tool](https://github.com/surya-rakanta/EPJsDeOb).

![andrew](/docs/cs.png)