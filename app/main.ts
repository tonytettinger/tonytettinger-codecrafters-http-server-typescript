import * as net from "net"

const responseTypes = {
  200: "HTTP/1.1 200 OK\r\n\r\n",
  400: "HTTP/1.1 404 Not Found\r\n\r\n",
}

const parseResponse = (resp: Buffer) => {
  const responseString = resp.toString().split(" ")
  const [requestType, path] = responseString
  return { requestType, path }
}
const server = net.createServer((socket) => {
  console.log("test")
  socket.on("data", (data) => {
    const parsedReq = parseResponse(data)
    let response = responseTypes[400]
    if (parsedReq.path == "/") {
      response = responseTypes[200]
    }
    socket.write(response)
    socket.end()
  })
})

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!")

// Uncomment this to pass the first stage
server.listen(4221, "localhost", () => {
  console.log("Server is running on port 4221")
})
