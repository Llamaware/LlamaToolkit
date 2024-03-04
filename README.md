
# LlamaToolkit 2.0

A decompilation toolkit for The Coffin of Andy and Leyley. (Formerly IelmenDecryptor)

### Usage

Place the program and the `llama` folder in the main directory that contains `game.exe` and run LlamaToolkit from the command line.

```
LlamaToolkit.exe <mode> <arguments>
```

### Decrypt

The filenames of all encrypted files must be unchanged.

Arguments:

`inputFileOrDir`: Specify the input directory or file. If directory, it will traverse all folders in the directory recursively.

`outputDir`: Specify the output directory.

You must pass both arguments at once. Both relative and absolute paths are supported.

If no arguments are provided, LlamaToolkit will only check the `audio`, `data`, and `img` folders in the game directory.

```
LlamaToolkit.exe decrypt <inputFileOrDir> <outputDir>
```

### DeDRM

Allows the game to be launched without Steam.

Arguments:

`gameDir`: Specify the game directory.

If no arguments are provided, LlamaToolkit will assume that it is currently inside of the game directory.

```
LlamaToolkit.exe dedrm <gameDir>
```

### Deobfuscate (Manually)

Acquire the obfuscated game code.

You can do this by launching the game with the [nwjs SDK](https://nwjs.io/), adding `console.dir(_0x7cbe1a.textContent);` right after the declaration of the packed code function `_()`, and saving the console output to a file.

Split the obfuscated code into two files. One file will be `header.js` containing the large string array and the rotating functions. The other file `detail.js` will contain the rest of the code, beginning from the line `use strict;`

Run the contents of `detail.js` through [Obfuscator.io Deobfuscator](https://obf-io.deobfuscate.io/).

Then run LlamaToolkit `deob` on both files, giving it the name of the replacement function (in this case, it's `_0x59166b`).

```
LlamaToolkit.exe deob _0x59166b header.js detail.js
```

All calls to that function will be deobfuscated, and hexadecimal numbers will be replaced with decimal numbers. The new file will be saved to `detail-result.js`.

### Credits

LlamaToolkit uses the `Microsoft.CodeAnalysis` package, which is licensed under the [MIT License](https://github.com/dotnet/roslyn/blob/main/License.txt).

The deobfuscator is based on [EPJsDeOb: JavaScript Deobfuscation tool](https://github.com/surya-rakanta/EPJsDeOb).

![andrew](/docs/cs.png)