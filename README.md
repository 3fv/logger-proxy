# @3fv/logger-proxy
---

## Overview

With so many logging libraries out there, and the fact that I felt I was creating the same boilerplate configs with
different libs depending on target platforms as well as logging backends, etc. I finally decided to implement a simple
logging framework that's meant to be used with other frameworks & loggers; `Tracer`, `Morgan`, `Winston`.

Works across `browser` & `node` & `deno`

Now, that is a fairly common statement from those that write logging frameworks including the aforementioned; but this
is truly meant to be a `proxy` & with that it enables things like backend async context stacks. i.e. default config goes
to a file appender, but your job's also have an additional append via an async context (Think `ThreadLocal` in
the `java` or `std::thread_local` in `c++` ).

`@3fv/logger-proxy` hotswap logging backends

## Install

```shell
pnpm add @3fv/logger-proxy
```

## Usage

### Basic

```typescript
import {
  getLogger,
  LevelNames, getLoggingManager
} from "@3fv/logger-proxy"


getLoggingManager().configure({
  // Default appenders list is [ConsoleAppender], 
  // so the following is not needed and only 
  // remains as an example:
  //
  // appenders: [new ConsoleAppender()],
  rootLevel: "trace"
})

const log = getLogger(__filename)

LevelNames.forEach((name) =>
  log[name].call(log, `example %s`, name)
)

```

### Context Stacks (the coolest bit)

For verboseness as well as the fact I'm lazy, here's a complete unit test illustrating the capabilities (in `jest`)

```typescript
import {
  Appender,
  getLoggingManager,
  LogContext,
  Logger,
  getLogger
} from "@3fv/logger-proxy"

type Jest = typeof jest
type MockAppender = Appender & {
  append: Appender["append"] & ReturnType<Jest["fn"]>
}

function newMockAppender(): MockAppender {
  const fn = jest.fn((record: any) => {
    console.log(`record`, record)
  })
  return {
    append: fn
  }
}

describe("NodeContextProvider", () => {
  jest.setTimeout(10000)
  
  const manager = getLoggingManager()
  let baseAppender: MockAppender
  let contextAppender1: MockAppender
  let contextAppender2: MockAppender
  let context1: LogContext
  let context2: LogContext
  let log1: Logger
  let log2: Logger
  
  beforeEach(() => {
    baseAppender = newMockAppender()
    
    contextAppender1 = newMockAppender()
    contextAppender2 = newMockAppender()
    
    context1 = LogContext.with([contextAppender1])
    context2 = LogContext.with([contextAppender2])
    
    manager.setAppenders(baseAppender).setRootLevel("debug")
    
    log1 = getLogger("log1")
    log2 = getLogger("log2")
  })
  
  it("works with no contexts", async () => {
    log1.info("test1")
    log2.info("test2")
    
    expect(baseAppender.append).toHaveBeenCalledTimes(2)
  })
  
  it("works with no context provider", async () => {
    log1.info("test1")
    await context1.use(async () => {
      log1.info("test2")
    })
    
    expect(baseAppender.append).toHaveBeenCalledTimes(2)
    expect(contextAppender1.append).toHaveBeenCalledTimes(0)
  })
  
  it("works with 1 contexts", async () => {
    
    // You must explicitly `install` the context provider to use contexts
    await import("@3fv/logger-proxy/context/providers/node")
    
    log1.info("test1")
    await context1.use(async () => {
      log1.info("test2")
    })
    
    expect(baseAppender.append).toHaveBeenCalledTimes(2)
    expect(contextAppender1.append).toHaveBeenCalledTimes(1)
  })
  
  it("works with n contexts", async () => {
    
    // You must explicitly `install` the context provider to use contexts
    await import("@3fv/logger-proxy/context/providers/node")
    
    log1.info("test1")
    await context1.use(async () => {
      log1.info("test2")
      await context2.use(async () => {
        log1.info("test3")
      })
    })
    
    expect(baseAppender.append).toHaveBeenCalledTimes(3)
    expect(contextAppender1.append).toHaveBeenCalledTimes(2)
    expect(contextAppender2.append).toHaveBeenCalledTimes(1)
  })
})

```

## Commands

[pnpm](https://pnpm.io) is the package manager, at the version pinned by the
`packageManager` field of `package.json`.

| Command            | What it does                                                    |
| ------------------ | --------------------------------------------------------------- |
| `pnpm install`     | Installs dependencies from `pnpm-lock.yaml`                     |
| `pnpm build`       | Compiles `src/` to `lib/mjs` and `lib/cjs` (`tsc -b`)           |
| `pnpm build:watch` | Same, in watch mode                                             |
| `pnpm test`        | Runs jest over the compiled specs in `lib/cjs` (build first)    |
| `pnpm test:dev`    | Builds, then runs the build and the tests in watch mode         |
| `pnpm release`     | Starts the GitHub Actions release workflow (patch bump)         |

`pnpm-workspace.yaml` denies the `electron` and `@parcel/watcher` install
scripts: nothing here runs the Electron binary, and the watcher's native binary
comes from its optional dependencies.

The package is a hybrid: `lib/mjs` holds the ES modules and `lib/cjs` the
CommonJS build, selected through the `exports` map of `package.json`. `lodash`
functions are imported one file at a time (`lodash/pick.js`), which is the form
that loads in native Node ES modules as well as in CommonJS.

To use a local checkout from another project, run
`pnpm link /path/to/logger-proxy` in that project after `pnpm build` here.

## Releasing

Releases run entirely in GitHub Actions (`.github/workflows/release.yml`),
started by `pnpm release` or by
`gh workflow run release.yml --ref master -f bump=<patch|minor|major|none>` (add
`-f dist-tag=<tag>` to publish under a tag other than `latest`):

1. The `version` job runs `pnpm version`, which builds and tests the package
   (`preversion`), commits and tags `vX.Y.Z`, and pushes both to `master`.
2. The `publish` job checks out that tag, builds it and runs `npm publish`
   through npm trusted publishing, so no npm token or two-factor prompt is
   involved. If it fails, re-run that job alone: it publishes the same tag.

`bump=none` publishes the version already in `package.json` at the dispatched
commit without bumping or tagging.

Trusted publishing needs a one-time registration of the workflow on npm:

    npm trust github @3fv/logger-proxy --repo 3fv/logger-proxy --file release.yml --allow-publish
