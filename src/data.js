export const troubleshootingGuides = [
  {
    id: 'device-wont-turn-on',
    title: "Device won't turn on",
    category: 'Power',
    summary: 'Try these checks if your phone, tablet, or laptop will not start.',
    steps: [
      'Check the device and charging cable for visible damage. Do not use damaged equipment.',
      'Connect the device to a known-working wall outlet and compatible charger.',
      'Leave it charging for at least 30 minutes, then try turning it on again.',
      'If your device has a manufacturer-documented force-restart button combination, follow the instructions for your exact model.',
      'If it still will not turn on, arrange a professional inspection.',
    ],
    safetyNote:
      'Stop charging if the device becomes unusually hot, smells unusual, or looks swollen.',
  },
  {
    id: 'battery-draining-fast',
    title: 'Battery draining fast',
    category: 'Battery',
    summary: 'Review power use and settings when a charge does not last as long as expected.',
    steps: [
      'Open the device battery settings and check which apps or features use the most power.',
      'Close apps you are not using and reduce screen brightness.',
      'Turn off features such as Bluetooth, location, or hotspot when you do not need them.',
      'Install available system and app updates, then restart the device.',
      'If battery life remains poor, check the manufacturer support options for a battery health assessment.',
    ],
    safetyNote:
      'Do not open or puncture a built-in battery. Stop using the device if its battery appears swollen.',
  },
  {
    id: 'screen-unresponsive',
    title: 'Screen is unresponsive',
    category: 'Screen',
    summary: 'Try basic checks if the display does not respond to touch or input.',
    steps: [
      'Wipe the screen with a soft, dry cloth and make sure your hands are clean and dry.',
      'Remove gloves and disconnect accessories that could interfere with touch input.',
      'If the screen is cracked or has liquid damage, avoid pressing on it.',
      'Restart the device using its normal controls or the manufacturer-documented restart method.',
      'If part of the screen still does not respond, back up your data if possible and arrange a repair.',
    ],
    safetyNote:
      'Do not try to remove broken glass yourself. Protect the screen and seek professional repair.',
  },
  {
    id: 'device-overheating',
    title: 'Device is overheating',
    category: 'Performance',
    summary: 'Reduce heat and check for common causes of an unusually warm device.',
    steps: [
      'Unplug the device and move it out of direct sunlight or away from other heat sources.',
      'Close demanding apps and let the device rest on a hard, open surface.',
      'Remove a thick case temporarily if it can be removed safely.',
      'After it cools, check for system updates and review apps using unusually high battery or processor activity.',
      'If overheating returns during light use, stop using the device and contact the manufacturer or a repair professional.',
    ],
    safetyNote:
      'Do not put the device in a refrigerator or freezer. Stop using it if it becomes extremely hot, swells, or emits an unusual odor.',
  },
  {
    id: 'wifi-not-connecting',
    title: 'Wi-Fi will not connect',
    category: 'Connectivity',
    summary: 'Check the network and device settings when Wi-Fi is unavailable.',
    steps: [
      'Confirm Wi-Fi is turned on and airplane mode is turned off.',
      'Check whether another device can connect to the same Wi-Fi network.',
      'Move closer to the router and re-enter the Wi-Fi password carefully.',
      'Restart the device and, if you have access, restart the router using its normal power controls.',
      'If only this device has trouble, forget the network and reconnect. Make sure you know the password first.',
    ],
    safetyNote:
      'Do not share your Wi-Fi password with people you do not trust.',
  },
  {
    id: 'device-running-slow',
    title: 'Device is running slowly',
    category: 'Performance',
    summary: 'Free up resources and check for updates to improve everyday performance.',
    steps: [
      'Restart the device to close background tasks that may have become stuck.',
      'Close apps and browser tabs you are not using.',
      'Check available storage and remove files or apps you no longer need after backing up anything important.',
      'Install pending system and app updates from the device settings or official app store.',
      'If the problem started after installing an app or update, check the manufacturer support guidance before resetting the device.',
    ],
    safetyNote:
      'Back up important data before deleting files or changing device settings.',
  },
]
