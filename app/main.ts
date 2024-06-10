import * as net from "net"

const responseTypes = {
  200: "HTTP/1.1 200 OK\r\n",
  404: "HTTP/1.1 404 Not Found\r\n\r\n",
}

const contentTypes = {
  text: "Content-Type: text/plain\r\n",
}

const contentLength = (number: number) => `Content-Length: ${number}\r\n\r\n`

const echoTextPathMatch = (path: string) => {
  const regex = /\/echo\/(\w+)/
  const match = path.match(regex)
  const text = match !== null ? match[1] : ""
  const textLength = text?.length
  if (match == null || text == "" || textLength == 0) return false
  const response =
    responseTypes[200] + contentTypes.text + contentLength(textLength) + text
  return response
}

const userAgentMatch = (path: string, agent: string) => {
  const regex = /\/user-agent/
  const match = path.match(regex)
  const text = agent
  const textLength = text?.length
  if (match == null || text == "" || textLength == 0) return false
  let response =
    responseTypes[200] + contentTypes.text + contentLength(textLength) + text
  return response
}

const basePathMatch = (path: string) =>
  path === "/" ? responseTypes[200] : false

const matchers = [echoTextPathMatch, userAgentMatch, basePathMatch]

const matchPaths = (path: string, userAgent = "") => {
  let res = responseTypes[404]
  let currentCheck
  for (const matchFunc of matchers) {
    currentCheck = matchFunc(path, userAgent)
    if (typeof currentCheck == "string") {
      res = currentCheck
      break
    }
  }
  return res
}

const endRequestLine = "\r\n"

const parseResponse = (resp: Buffer) => {
  const [request, , userAgent] = resp.toString().split("\r\n")
  const [, path] = request.split(" ")
  const [, agent] = userAgent.split(" ")
  return { path, agent }
}

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const parsedReq = parseResponse(data)
    let response = matchPaths(parsedReq.path, parsedReq.agent)
      ? matchPaths(parsedReq.path, parsedReq.agent)
      : responseTypes[404]
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
