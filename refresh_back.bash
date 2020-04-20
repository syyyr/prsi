{
    pushd images &> /dev/null
    echo "export default 'data:image/webp;base64,$(base64 -w0 cardback-resize.webp)'"
} > src/client/images/cardback-image.ts
