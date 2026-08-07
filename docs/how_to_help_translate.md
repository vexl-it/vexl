# How to Help Translate and Localize Vexl

Vexl translations are machine-translated with [General Translation](https://generaltranslation.com/) and reviewed in its dashboard. English is the source of truth, and translated locale files are committed under `packages/localization/locales/<language>/`.

Community corrections are welcome through [GitHub issues](https://github.com/vexl-it/vexl/issues/new) or pull requests that edit the relevant locale JSON file. Keep dotted keys and `{{variable}}` placeholders unchanged. If you submit a correction directly to a locale file, the same correction must also be made in the General Translation dashboard so a later automated sync does not overwrite it.

## Translators Debug Mode

The Vexl app can show the translation key for text on screen, making it easier to identify the right entry in a locale file or describe a correction.

### Step 1: Open the Debug Screen

1. Open the Vexl app.
2. Open your user profile by tapping the person icon at the bottom of the app.
3. Scroll to the app version and tap it 8 times. A notification confirms that Debug Screen Mode is enabled.

<img src="images/image18.png" width="500">

### Step 2: Choose Your Language

Select the language you are reviewing from the language picker in the Debug Screen.

<img src="images/image14.png" width="500">

### Step 3: Enable Translators Debug Mode

Open the Translators Debug section and turn on **Show Translators Debug Mode**. A floating magnifying-glass button (🔍) appears in the app.

<img src="images/image8.png" width="500">

### Step 4: Inspect Translation Keys

Tap the floating 🔍 button whenever you need to see the keys for text on the current screen. Use those keys to find the translation under `packages/localization/locales/<language>/` or include them in your issue.

<img src="images/image15.png" width="500">

<img src="images/image12.png" width="500">

### Step 5: Disable Translators Debug Mode

Return to the Debug Screen and turn off **Show Translators Debug Mode** to remove the floating button.

Thank you for helping make Vexl clear and accessible in more languages.
