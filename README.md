
# LlamaToolkit 2.0

[![GLWTPL](https://img.shields.io/badge/GLWT-Public_License-red.svg)](https://github.com/me-shaon/GLWTPL)

![tsunderecoded](/docs/tsun.png)

A decompilation toolkit for The Coffin of Andy and Leyley.

### Prerequisites

To run the compiled binaries, you need the .NET 8.0 Runtime to be installed.

You need a Node.js installation to use the deobfuscator.

### Usage

Place the program and the `llama` folder in the main directory that contains `Game.exe` and run LlamaToolkit from the command line.

```
LlamaToolkit <mode> <arguments>
```

### Decrypt

Only `.k9a` files can be decrypted. The filenames of all encrypted files must be unchanged.

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

### Extract and Deobfuscate (Automatically)

Go to the `llama/decode-js` folder and use `npm i` to install dependencies.

Then run the command:

```
LlamaToolkit autopwn <gameDir>
```

If no arguments are provided, LlamaToolkit will assume that it is currently inside of the game directory.

This command will carry out the following operations:

1. Inject the code extractor into the game.
2. Launch the game and dump obfuscated code to `input.js`.
3. Kill the game.
4. Remove the code extractor from the game.
5. Deobfuscate the code in `input.js` and save it to `output.js`.

### ReDRM

Restore the DRM.

```
LlamaToolkit redrm <gameDir>
```

### Extract and Deobfuscate (Manually)

![abc](/docs/abc.png)

Acquire the obfuscated game code by injecting a script into the game:

```
LlamaToolkit extract <gameDir>
```

The game will dump obfuscated code to a new file named `input.js` on the next startup.

Run the deobfuscator on this file:

```
LlamaToolkit deob input.js
```

The new file will be saved to `output.js`.

Remove the code extractor from the game:

```
LlamaToolkit restore <gameDir>
```

### Credits

LlamaToolkit uses the `Jering.Javascript.NodeJS` package, which has its own [license](https://github.com/JeringTech/Javascript.NodeJS/blob/master/License.md).

The deobfuscator uses [decode-js](https://github.com/echo094/decode-js), which is licensed under the MIT License.

![andrew](/docs/cs.png)

*Last updated 3/03/2024 for game version 2.0.11*