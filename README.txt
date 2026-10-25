LlamaToolkit 3.0
Decompilation Toolkit for The Coffin of Andy and Leyley by Llamaware

Works with game version 3.x (Decay). Tested with game version 3.0.13.


HOW TO USE
----------

1. Put LlamaToolkit.exe in the game folder (the one with Game.exe).
2. Double-click it.
3. Pick an option from the menu. Results are saved in the game folder.

If the game isn't found, drag the game folder onto the window and press Enter.

Menu options:

  Decrypt assets
      Decrypts images, audio and data into a "decrypted" folder.
      Original file names are not required for decryption.

  Extract game script (deobfuscated)
      Saves the game's hidden main script as readable code
      (script_deobfuscated.js). The game is not launched or modified.

  Extract game script (obfuscated)
      Saves the same script exactly as the game runs it (script_obfuscated.js).

  Remove DRM / Restore DRM
      Lets the game run without Steam, or undoes that.
      The original file is kept as www/greenworks/greenworks.bak.


COMMAND LINE
------------

The same features are available from a command prompt. Run from inside the
game folder, or pass the game folder as an argument.

  LlamaToolkit decrypt [input] [output]
  LlamaToolkit deob [gameDir] [-o script_deobfuscated.js]
  LlamaToolkit deob -f script_obfuscated.js
  LlamaToolkit dump [gameDir] [-o script_obfuscated.js]
  LlamaToolkit dedrm [gameDir]
  LlamaToolkit redrm [gameDir]

For decrypt, [input] can be a single file, any folder, or the game folder.
[output] defaults to "decrypted".

Run "LlamaToolkit <command> -h" for details on any command.


CREDITS
-------

The deobfuscator uses PyJSClear (https://github.com/intezer/PyJSClear),
licensed under the Apache-2.0 License.

Source code: https://github.com/Llamaware/LlamaToolkit
