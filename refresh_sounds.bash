{
    pushd sounds &> /dev/null
    echo 'import {LastAction} from "../common/types";'
    echo 'export const audio = {'
    echo "    playReminder: 'data:audio/mp3;base64,$(base64 -w0 playReminder.compressed.mp3)',"
    for draw in DrawFour DrawSix DrawEight; do
        echo "    [LastAction.${draw}]: 'data:audio/mp3;base64,$(base64 -w0 ${draw}.compressed.mp3)',"
    done
    echo "}"
} > src/client/sounds.ts
