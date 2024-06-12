import * as net from "net"
import fs from "fs"
import * as process from "process"

const responseTypes = {
  200: "HTTP/1.1 200 OK\r\n",
  201: "HTTP/1.1 201 Created\r\n",
  404: "HTTP/1.1 404 Not Found\r\n\r\n",
}

const contentTypes = {
  text: "Content-Type: text/plain\r\n",
  file: "Content-Type: application/octet-stream\r\n",
}

type MatchingFunctionArgs = {
  path?: string
  userAgent?: string
  type?: string
  length?: string
  body?: string
  encoding?: string
}

const contentLength = (number: number) => `Content-Length: ${number}\r\n\r\n`
const encodingType = (encoding: string) =>
  `Content-Encoding: ${encoding}\r\n\r\n`

const echoTextPathMatch = (args: MatchingFunctionArgs) => {
  if (args.path === undefined) return false
  const regex = /\/echo\/(\w+)/
  const match = args.path.match(regex)
  const text = match !== null ? match[1] : ""
  const textLength = text?.length
  if (match == null || text == "" || textLength == 0) return false
  const response =
    responseTypes[200] + contentTypes.text + contentLength(textLength) + text
  return response
}

const userAgentMatch = (args: MatchingFunctionArgs) => {
  if (args.path === undefined) return false
  const regex = /\/user-agent/
  const match = args.path.match(regex)
  const text = args.userAgent
  const textLength = text?.length ?? 0
  if (match == null || text == "" || textLength == 0) return false
  let response =
    responseTypes[200] + contentTypes.text + contentLength(textLength) + text
  return response
}

const fileMatch = (args: MatchingFunctionArgs) => {
  const regex = /\/files\/(\w+)/
  if (args.path === undefined) return false
  const match = args.path.match(regex)
  const fileName = match !== null ? match[1] : ""
  let directory: string = process.argv[3]

  const pathToFile = `${directory}/${fileName}`
  let responseContent = null
  try {
    responseContent = fs.readFileSync(pathToFile)
  } catch {
    return false
  }

  if (match == null || responseContent == null) return false
  return (
    responseTypes[200] +
    contentTypes.file +
    contentLength(responseContent.length) +
    responseContent
  )
}

const basePathMatch = (args: MatchingFunctionArgs) =>
  args.path === "/" ? responseTypes[200] : false

const postFileMatch = (args: MatchingFunctionArgs) => {
  if (args.type === "POST" && args.length && args.body && args.path) {
    const regex = /\/files\/(\w+)/
    const match = args.path.match(regex)
    const fileName = match !== null ? match[1] : ""
    const directory = process.argv[3]
    const writePath = `${directory}/${fileName}`
    try {
      fs.writeFileSync(writePath, args.body, "utf-8")
    } catch {
      return false
    }
    return responseTypes[201]
  }
}

const matchers = [
  echoTextPathMatch,
  userAgentMatch,
  basePathMatch,
  fileMatch,
  postFileMatch,
]

const validEncodings = ["gzip"]
const checkValidEncoding = (encodings: string[]) => {
  return encodings.map((el) => validEncodings.includes(el)).join("")
}

const checkEncoding = (encoding: string, res: string) => {
  const encodings = encoding.split(", ")
  return encoding
  const usedEncoding = checkValidEncoding(encodings)
  return usedEncoding
  if (encoding && usedEncoding) {
    const currentRes = res.split("\r\n")
    const withEncoding = [
      ...currentRes.slice(0, 1),
      usedEncoding,
      ...currentRes.slice(1),
    ]
    return withEncoding.join("\r\n")
  } else {
    return res
  }
}

const matchPaths = (args: MatchingFunctionArgs) => {
  let res = responseTypes[404]
  let currentCheck
  for (const matchFunc of matchers) {
    currentCheck = matchFunc(args)
    if (typeof currentCheck == "string") {
      res = currentCheck
      break
    }
  }
  if (args.encoding) {
    res = checkEncoding(args.encoding, res)
  }
  return res
}

const endRequestLine = "\r\n"

const responeLines = {
  agent: ["User-Agent:"],
  path: ["POST", "GET"],
  length: ["Content-Length:"],
  encoding: ["Accept-Encoding:"],
} as const

type ParsedResponses = {
  agent?: string
  path?: string
  length?: string
  body?: string
  type?: string
  encoding?: string
}

const parseResponse = (resp: Buffer) => {
  let responseData: ParsedResponses = {}
  const responseArray = resp.toString().split("\r\n")
  for (const responseLine of responseArray) {
    const [responseKey, responseValue] = responseLine.split(" ")
    for (const [key, value] of Object.entries(responeLines)) {
      value.forEach((val) => {
        if (responeLines.path.includes(responseKey as "POST" | "GET")) {
          console.log("In path", responseKey)
          responseData["type"] = responseKey
        }
        if (val === responseKey)
          responseData[key as keyof ParsedResponses] = responseValue
        else if (responseLine[0] !== "") {
          responseData.body = responseLine
        }
      })
    }
  }

  return responseData
}

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    let response
    const parsedReq = parseResponse(data)
    const argumentsForMatcher = {
      path: parsedReq.path,
      userAgent: parsedReq.agent,
      type: parsedReq.type,
      length: parsedReq.length,
      body: parsedReq.body,
      encoding: parsedReq.encoding,
    }
    try {
      response = matchPaths(argumentsForMatcher)
    } catch {
      console.log("Error in request")
      response = responseTypes[404]
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
