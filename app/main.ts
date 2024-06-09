import * as net from "net"

const responseTypes = {
  200: "HTTP/1.1 200 OK\r\n",
  404: "HTTP/1.1 404 Not Found\r\n\r\n",
}

const contentTypes = {
  text: "Content-Type: text/plain\r\n",
}

const contentLength = (number: number) => `Content-Length: ${number}\r\n\r\n`

const echoTextMatch = (text: string) => {
  const match = text.match(/\/echo\/(\w+)/)
  const result = match?.length ? match[1] : false
  return result
}

const endRequestLine = "\r\n"

const parseResponse = (resp: Buffer) => {
  const [request] = resp.toString().split("\r\n")
  const [, path] = request.split(" ")
  return { path }
}
const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const parsedReq = parseResponse(data)
    let response = responseTypes[404]
    if (parsedReq.path == "/") {
      response = responseTypes[200]
    } else if (echoTextMatch(parsedReq.path)) {
      const matchedText = echoTextMatch(parsedReq.path)
      const matchedTextLength = matchedText ? matchedText.length : 0
      response =
        responseTypes[200] +
        contentTypes.text +
        contentLength(matchedTextLength) +
        matchedText
    }
    socket.write(response + endRequestLine)
    socket.end()
  })
})

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!")

// Uncomment this to pass the first stage
server.listen(4221, "localhost", () => {
  console.log("Server is running on port 4221")
})
