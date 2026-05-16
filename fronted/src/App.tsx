import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  Eye,
  FolderOpen,
  Grid3X3,
  Heart,
  ImageIcon,
  Images,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Search,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  addUser,
  chatWithGalleryAssistant,
  createSpace,
  deletePicture,
  deleteSpace,
  deleteUser,
  editSpace,
  getLoginUser,
  getPictureTagCategory,
  getPictureVO,
  likePicture,
  listPicturesBySpace,
  listPicturesForAdmin,
  listPublicPictures,
  listSpaceLevels,
  listSpaces,
  listUsers,
  login,
  logout,
  register,
  reviewPicture,
  updatePicture,
  updateUser,
  uploadPictureByUrl,
  uploadPictureFile,
  uploadPictureToSpace,
  uploadPictureToSpaceByUrl,
  type LoginUser,
  type Picture,
  type SpaceLevel,
  type SpaceVO,
  type UserVO,
} from "@/lib/api"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 20
const MANAGE_PAGE_SIZE = 10
const ALL_TAG = "全部"

type ViewKey = "gallery" | "mySpaces" | "assistant" | "profile" | "spaces" | "users" | "pictures" | "spaceDetail"
type AuthMode = "login" | "register"
type Notice = { type: "success" | "error"; text: string } | null
type ChatMessage = {
  id: number
  role: "user" | "assistant"
  content: string
  createdAt: string
}

const reviewLabels: Record<number, string> = {
  0: "待审核",
  1: "已通过",
  2: "已拒绝",
}

function App() {
  const [user, setUser] = useState<LoginUser | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    getLoginUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setCheckingSession(false))
  }, [])

  if (checkingSession) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </main>
    )
  }

  if (!user) {
    return <AuthPage onLogin={setUser} />
  }

  return <Dashboard user={user} onLogout={() => setUser(null)} />
}

function AuthPage({ onLogin }: { onLogin: (user: LoginUser) => void }) {
  const [mode, setMode] = useState<AuthMode>("login")
  const [userAccount, setUserAccount] = useState("")
  const [userPassword, setUserPassword] = useState("")
  const [checkPassword, setCheckPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)

    if (!userAccount.trim() || !userPassword.trim()) {
      setNotice({ type: "error", text: "请输入账号和密码" })
      return
    }

    if (mode === "register" && userPassword !== checkPassword) {
      setNotice({ type: "error", text: "两次输入的密码不一致" })
      return
    }

    setLoading(true)
    try {
      if (mode === "register") {
        await register(userAccount.trim(), userPassword, checkPassword)
        setNotice({ type: "success", text: "注册成功，正在登录" })
      }

      const loginUser = await login(userAccount.trim(), userPassword)
      onLogin(loginUser)
    } catch (err) {
      setNotice({
        type: "error",
        text: err instanceof Error ? err.message : mode === "login" ? "登录失败" : "注册失败",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_38%,#f5f5f4_100%)] text-foreground">
      <div className="mx-auto grid min-h-svh w-full max-w-6xl grid-cols-1 px-5 py-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:px-8">
        <section className="flex min-h-[42svh] flex-col justify-between py-6 lg:min-h-0 lg:py-10">
          <BrandBlock />

          <div className="max-w-xl py-14 lg:py-0">
            <Badge variant="outline" className="mb-5 gap-1.5 bg-white/70">
              <Sparkles className="size-3.5" />
              Curated public gallery
            </Badge>
            <h1 className="text-4xl font-semibold leading-tight tracking-normal text-balance md:text-6xl">
              管理和浏览你的高质量图片资产
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
              登录后进入公共图库，也可以在管理员视图中管理用户、图片、审核状态和基础图片信息。
            </p>
          </div>

          <div className="grid max-w-xl grid-cols-3 gap-3 text-sm">
            {[
              ["注册登录", "开放注册入口"],
              ["图片详情", "点击后查看信息"],
              ["管理工作台", "用户与图片维护"],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-lg border bg-white/60 p-3 backdrop-blur">
                <div className="font-medium">{title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center lg:justify-end">
          <Card className="w-full max-w-md border-black/10 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
            <CardHeader className="space-y-2 px-6 pt-6">
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
                <Button
                  type="button"
                  variant={mode === "login" ? "default" : "ghost"}
                  onClick={() => setMode("login")}
                >
                  登录
                </Button>
                <Button
                  type="button"
                  variant={mode === "register" ? "default" : "ghost"}
                  onClick={() => setMode("register")}
                >
                  注册
                </Button>
              </div>
              <CardTitle className="text-2xl">
                {mode === "login" ? "欢迎回来" : "创建账号"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {mode === "login"
                  ? "使用后端 /user/login 接口登录，成功后进入公共图库。"
                  : "注册成功后会自动登录并进入系统。"}
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <Field label="账号" htmlFor="userAccount">
                  <Input
                    id="userAccount"
                    autoComplete="username"
                    placeholder="请输入账号"
                    value={userAccount}
                    onChange={(event) => setUserAccount(event.target.value)}
                  />
                </Field>

                <Field label="密码" htmlFor="userPassword">
                  <Input
                    id="userPassword"
                    type="password"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder="请输入密码"
                    value={userPassword}
                    onChange={(event) => setUserPassword(event.target.value)}
                  />
                </Field>

                {mode === "register" ? (
                  <Field label="确认密码" htmlFor="checkPassword">
                    <Input
                      id="checkPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="请再次输入密码"
                      value={checkPassword}
                      onChange={(event) => setCheckPassword(event.target.value)}
                    />
                  </Field>
                ) : null}

                <NoticeBox notice={notice} />

                <Button className="h-10 w-full" type="submit" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : null}
                  {mode === "login" ? "进入图库" : "注册并登录"}
                  {!loading ? <ArrowRight /> : null}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}

function Dashboard({
  user,
  onLogout,
}: {
  user: LoginUser
  onLogout: () => void
}) {
  const [activeView, setActiveView] = useState<ViewKey>("gallery")
  const [selectedSpace, setSelectedSpace] = useState<SpaceVO | null>(null)
  const isAdmin = user.userRole === "admin"

  function navigateToSpaceDetail(space: SpaceVO) {
    setSelectedSpace(space)
    setActiveView("spaceDetail")
  }

  function backFromSpaceDetail() {
    setSelectedSpace(null)
    setActiveView("mySpaces")
  }

  async function handleLogout() {
    try {
      await logout()
    } finally {
      onLogout()
    }
  }

  return (
    <main className="min-h-svh bg-[#f7f7f5] text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
          <BrandBlock compact />

          <nav className="hidden items-center gap-1 md:flex">
            <NavButton active={activeView === "gallery"} onClick={() => setActiveView("gallery")}>
              <Grid3X3 />
              公共图库
            </NavButton>
            <NavButton active={activeView === "mySpaces" || activeView === "spaceDetail"} onClick={() => setActiveView("mySpaces")}>
              <FolderOpen />
              我的空间
            </NavButton>
            <NavButton active={activeView === "assistant"} onClick={() => setActiveView("assistant")}>
              <Bot />
              图库助手
            </NavButton>
            {isAdmin ? (
              <>
                <Separator orientation="vertical" className="mx-1 h-6" />
                <NavButton active={activeView === "spaces"} onClick={() => setActiveView("spaces")}>
                  <Shield className="size-3.5" />
                  空间管理
                </NavButton>
                <NavButton active={activeView === "users"} onClick={() => setActiveView("users")}>
                  <Users />
                  用户管理
                </NavButton>
                <NavButton active={activeView === "pictures"} onClick={() => setActiveView("pictures")}>
                  <Images />
                  图片管理
                </NavButton>
              </>
            ) : null}
          </nav>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setActiveView("profile")}>
              <UserIdentity user={user} />
            </button>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="退出登录">
              <LogOut />
            </Button>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 md:hidden">
          {[
            ["gallery", "公共图库"],
            ["mySpaces", "我的空间"],
            ["assistant", "图库助手"],
            ...(isAdmin
              ? ([["spaces", "空间管理"], ["users", "用户管理"], ["pictures", "图片管理"]] as [string, string][])
              : []),
          ].map(([key, label]) => (
            <Button
              key={key}
              type="button"
              variant={activeView === key || (key === "mySpaces" && activeView === "spaceDetail") ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveView(key as ViewKey)}
            >
              {label}
            </Button>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {activeView === "gallery" ? <GalleryView /> : null}
        {activeView === "mySpaces" ? <MySpaceView userId={user.id} /> : null}
        {activeView === "spaceDetail" && selectedSpace ? (
          <SpaceDetailView space={selectedSpace} onBack={backFromSpaceDetail} />
        ) : null}
        {activeView === "spaces" ? (
          isAdmin ? <SpaceView onSelectSpace={navigateToSpaceDetail} /> : <PermissionView title="空间管理" />
        ) : null}
        {activeView === "profile" ? <ProfileView user={user} onUserUpdate={() => {}} onBack={() => setActiveView("gallery")} /> : null}
        {activeView === "assistant" ? <GalleryAssistantView /> : null}
        {activeView === "users" ? (
          isAdmin ? <UserManagementView /> : <PermissionView title="用户管理" />
        ) : null}
        {activeView === "pictures" ? (
          isAdmin ? <PictureManagementView /> : <PermissionView title="图片管理" />
        ) : null}
      </div>
    </main>
  )
}

function GalleryView() {
  const [pictures, setPictures] = useState<Picture[]>([])
  const [selectedPicture, setSelectedPicture] = useState<Picture | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [selectedTag, setSelectedTag] = useState(ALL_TAG)
  const [searchText, setSearchText] = useState("")
  const [appliedSearchText, setAppliedSearchText] = useState("")
  const [current, setCurrent] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)

  const hasMore = pictures.length < total || (total === 0 && pictures.length >= PAGE_SIZE)

  useEffect(() => {
    getPictureTagCategory()
      .then((data) => setTags([ALL_TAG, ...(data.tagList ?? [])]))
      .catch(() => setTags([ALL_TAG]))
  }, [])

  const loadPictures = useCallback(
    async (page: number, replace = false) => {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setNotice(null)

      try {
        const result = await listPublicPictures({
          current: page,
          pageSize: PAGE_SIZE,
          searchText: appliedSearchText || undefined,
          tags: selectedTag !== ALL_TAG ? [selectedTag] : undefined,
        })

        setPictures((previous) =>
          replace ? result.records ?? [] : [...previous, ...(result.records ?? [])],
        )
        setTotal(result.total ?? 0)
        setCurrent(page)
      } catch (err) {
        setNotice({ type: "error", text: err instanceof Error ? err.message : "图库加载失败" })
        if (replace) {
          setPictures([])
          setTotal(0)
        }
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [appliedSearchText, selectedTag],
  )

  useEffect(() => {
    void Promise.resolve().then(() => loadPictures(1, true))
  }, [loadPictures])

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAppliedSearchText(searchText.trim())
  }

  async function handleLike(pictureId: number) {
    try {
      const isLiked = await likePicture(pictureId)
      setPictures((items) =>
        items.map((item) =>
          item.id === pictureId
            ? {
                ...item,
                isLiked,
                likeCount: Math.max((item.likeCount ?? 0) + (isLiked ? 1 : -1), 0),
              }
            : item,
        ),
      )
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "点赞失败" })
    }
  }

  async function openDetail(picture: Picture) {
    setSelectedPicture(picture)
    try {
      const detail = await getPictureVO(picture.id)
      setSelectedPicture(detail)
    } catch {
      setSelectedPicture(picture)
    }
  }

  const stats = useMemo(
    () => [
      { label: "当前展示", value: pictures.length },
      { label: "后端总数", value: total },
      { label: "标签数量", value: Math.max(tags.length - 1, 0) },
    ],
    [pictures.length, tags.length, total],
  )

  return (
    <>
      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border bg-background p-5 shadow-xs md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              badge="Public Gallery"
              icon={<Grid3X3 className="size-3.5" />}
              title="公共图库"
              description="展示后端公开空间中的已审核图片。点击图片会打开详情，而不是直接下载。"
            />

            <form className="flex w-full gap-2 lg:w-[360px]" onSubmit={handleSearch}>
              <SearchInput
                value={searchText}
                onChange={setSearchText}
                placeholder="搜索图片名称或简介"
              />
              <Button className="h-10 px-4" type="submit">
                搜索
              </Button>
            </form>
          </div>

          <TagFilter tags={tags} selectedTag={selectedTag} onSelect={setSelectedTag} />
        </div>

        <StatsCard title="图库概览" stats={stats} />
      </section>

      <NoticeBox notice={notice} className="mt-5" />
      <Separator className="my-6" />

      {loading ? (
        <PictureSkeletonGrid />
      ) : pictures.length === 0 ? (
        <EmptyState title="暂无图片" description="当前筛选条件下没有公开图片。" />
      ) : (
        <>
          <section className="columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4">
            {pictures.map((picture) => (
              <PictureCard
                key={picture.id}
                picture={picture}
                onLike={handleLike}
                onOpen={openDetail}
              />
            ))}
          </section>

          <div className="flex justify-center py-8">
            {hasMore ? (
              <Button
                variant="outline"
                className="h-10"
                disabled={loadingMore}
                onClick={() => loadPictures(current + 1)}
              >
                {loadingMore ? <Loader2 className="animate-spin" /> : null}
                加载更多
              </Button>
            ) : (
              <span className="text-sm text-muted-foreground">已显示全部图片</span>
            )}
          </div>
        </>
      )}

      <PictureDetailDialog
        picture={selectedPicture}
        onClose={() => setSelectedPicture(null)}
      />
    </>
  )
}

function GalleryAssistantView() {
  const messageIdRef = useRef(2)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "你好，我是图库助手。可以问我如何上传图片、审核图片、管理用户、使用标签搜索，或者让图片信息更适合展示。",
      createdAt: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)

  const suggestions = [
    "如何让图片通过审核？",
    "图片管理页面能做什么？",
    "怎么给图片设置标签更利于搜索？",
    "用户管理里 admin 和 user 有什么区别？",
  ]

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim()
    if (!content || sending) return

    const userMessage: ChatMessage = {
      id: messageIdRef.current++,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    }

    setMessages((items) => [...items, userMessage])
    setInput("")
    setNotice(null)
    setSending(true)

    try {
      const reply = await chatWithGalleryAssistant(content)
      setMessages((items) => [
        ...items,
        {
          id: messageIdRef.current++,
          role: "assistant",
          content: reply,
          createdAt: new Date().toISOString(),
        },
      ])
    } catch (err) {
      setNotice({
        type: "error",
        text: err instanceof Error ? err.message : "助手暂时无法回复",
      })
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendMessage()
  }

  return (
    <section className="grid min-h-[calc(100svh-128px)] gap-4 lg:grid-cols-[320px_1fr]">
      <Card className="bg-background">
        <CardHeader>
          <Badge variant="outline" className="mb-2 w-fit gap-1.5">
            <Bot className="size-3.5" />
            Gallery Assistant
          </Badge>
          <CardTitle className="text-2xl">图库助手</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            基于后端豆包接口，面向图库使用、图片管理、审核和标签组织提供即时问答。
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
            建议先问具体操作问题，例如“如何审核图片”或“怎么提升图片搜索命中率”。
          </div>
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">快捷问题</div>
            {suggestions.map((item) => (
              <Button
                key={item}
                type="button"
                variant="outline"
                className="h-auto w-full justify-start whitespace-normal px-3 py-2 text-left"
                onClick={() => void sendMessage(item)}
                disabled={sending}
              >
                {item}
              </Button>
            ))}
          </div>
          <Separator />
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setMessages([
                {
                  id: messageIdRef.current++,
                  role: "assistant",
                  content: "会话已清空。你可以继续询问图库相关问题。",
                  createdAt: new Date().toISOString(),
                },
              ])
              setNotice(null)
            }}
          >
            清空会话
          </Button>
        </CardContent>
      </Card>

      <Card className="flex min-h-[560px] bg-background">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">对话</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">当前使用 `/doubao/chatWithPrompt`</p>
            </div>
            <Badge variant={sending ? "secondary" : "outline"}>
              {sending ? "思考中" : "在线"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col p-0">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
            {sending ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                图库助手正在组织回答
              </div>
            ) : null}
          </div>

          <div className="border-t p-4">
            <NoticeBox notice={notice} className="mb-3" />
            <form className="flex gap-2" onSubmit={handleSubmit}>
              <Input
                className="h-11"
                placeholder="输入你的图库问题..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
              />
              <Button type="submit" className="h-11 px-4" disabled={sending || !input.trim()}>
                {sending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                发送
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Bot className="size-4" />
        </div>
      ) : null}
      <div
        className={cn(
          "max-w-[min(720px,85%)] rounded-lg border px-4 py-3 text-sm leading-6 shadow-xs",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted/40",
        )}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
        <div className={cn("mt-2 text-[11px]", isUser ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  )
}

function UserManagementView() {
  const [users, setUsers] = useState<UserVO[]>([])
  const [searchText, setSearchText] = useState("")
  const [appliedSearchText, setAppliedSearchText] = useState("")
  const [current, setCurrent] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<Notice>(null)
  const [editingUser, setEditingUser] = useState<UserVO | null>(null)
  const [form, setForm] = useState({
    userAccount: "",
    userName: "",
    userAvatar: "",
    userProfile: "",
    userRole: "user",
  })

  const loadUsers = useCallback(
    async (page = current) => {
      setLoading(true)
      setNotice(null)
      try {
        const result = await listUsers({
          current: page,
          pageSize: MANAGE_PAGE_SIZE,
          userAccount: appliedSearchText || undefined,
          sortField: "createTime",
          sortOrder: "descend",
        })
        setUsers(result.records ?? [])
        setTotal(result.total ?? 0)
        setCurrent(page)
      } catch (err) {
        setNotice({ type: "error", text: err instanceof Error ? err.message : "用户加载失败" })
      } finally {
        setLoading(false)
      }
    },
    [appliedSearchText, current],
  )

  useEffect(() => {
    void Promise.resolve().then(() => loadUsers(1))
  }, [loadUsers])

  function resetForm() {
    setEditingUser(null)
    setForm({
      userAccount: "",
      userName: "",
      userAvatar: "",
      userProfile: "",
      userRole: "user",
    })
  }

  function startEdit(user: UserVO) {
    setEditingUser(user)
    setForm({
      userAccount: user.userAccount,
      userName: user.userName ?? "",
      userAvatar: user.userAvatar ?? "",
      userProfile: user.userProfile ?? "",
      userRole: user.userRole ?? "user",
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)

    try {
      if (editingUser) {
        await updateUser({
          id: editingUser.id,
          userName: form.userName,
          userAvatar: form.userAvatar,
          userProfile: form.userProfile,
          userRole: form.userRole,
        })
        setNotice({ type: "success", text: "用户已更新" })
      } else {
        await addUser({
          userAccount: form.userAccount.trim(),
          userName: form.userName,
          userAvatar: form.userAvatar,
          userProfile: form.userProfile,
          userRole: form.userRole,
        })
        setNotice({ type: "success", text: "用户已创建，默认密码为 12345678" })
      }
      resetForm()
      await loadUsers(1)
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "保存失败" })
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("确认删除这个用户？")) return
    try {
      await deleteUser(id)
      setNotice({ type: "success", text: "用户已删除" })
      await loadUsers(1)
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "删除失败" })
    }
  }

  return (
    <section className="space-y-5">
      <ManagementHeader
        icon={<Users className="size-3.5" />}
        badge="User Admin"
        title="用户管理"
        description="管理员可创建用户、编辑昵称头像和角色，并删除用户。新增用户默认密码为 12345678。"
      />

      <NoticeBox notice={notice} />

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="bg-background">
          <CardHeader>
            <CardTitle className="text-base">{editingUser ? "编辑用户" : "新增用户"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Field label="账号" htmlFor="manage-user-account">
                <Input
                  id="manage-user-account"
                  value={form.userAccount}
                  disabled={Boolean(editingUser)}
                  placeholder="请输入账号"
                  onChange={(event) => setForm({ ...form, userAccount: event.target.value })}
                />
              </Field>
              <Field label="昵称" htmlFor="manage-user-name">
                <Input
                  id="manage-user-name"
                  value={form.userName}
                  placeholder="请输入昵称"
                  onChange={(event) => setForm({ ...form, userName: event.target.value })}
                />
              </Field>
              <Field label="头像 URL" htmlFor="manage-user-avatar">
                <Input
                  id="manage-user-avatar"
                  value={form.userAvatar}
                  placeholder="https://..."
                  onChange={(event) => setForm({ ...form, userAvatar: event.target.value })}
                />
              </Field>
              <Field label="简介" htmlFor="manage-user-profile">
                <Input
                  id="manage-user-profile"
                  value={form.userProfile}
                  placeholder="一句话介绍"
                  onChange={(event) => setForm({ ...form, userProfile: event.target.value })}
                />
              </Field>
              <Field label="角色" htmlFor="manage-user-role">
                <select
                  id="manage-user-role"
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm"
                  value={form.userRole}
                  onChange={(event) => setForm({ ...form, userRole: event.target.value })}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </Field>

              <div className="flex gap-2">
                <Button type="submit" className="h-9 flex-1">
                  {editingUser ? <Check /> : <Plus />}
                  {editingUser ? "保存" : "创建"}
                </Button>
                {editingUser ? (
                  <Button type="button" variant="outline" className="h-9" onClick={resetForm}>
                    取消
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-background">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">用户列表</CardTitle>
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  setAppliedSearchText(searchText.trim())
                }}
              >
                <SearchInput
                  value={searchText}
                  onChange={setSearchText}
                  placeholder="搜索账号"
                  className="w-full sm:w-64"
                />
                <Button type="submit" className="h-10">
                  搜索
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              loading={loading}
              emptyText="暂无用户"
              columns={["用户", "角色", "创建时间", "操作"]}
            >
              {users.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        {item.userAvatar ? <AvatarImage src={item.userAvatar} alt={item.userAccount} /> : null}
                        <AvatarFallback>{(item.userName || item.userAccount).slice(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{item.userName || item.userAccount}</div>
                        <div className="text-xs text-muted-foreground">{item.userAccount}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={item.userRole === "admin" ? "default" : "secondary"}>
                      {item.userRole || "user"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(item.createTime)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => startEdit(item)}>
                        <Pencil />
                        编辑
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                        <Trash2 />
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
            <Pager
              current={current}
              total={total}
              pageSize={MANAGE_PAGE_SIZE}
              onPageChange={loadUsers}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function PictureManagementView() {
  const [pictures, setPictures] = useState<Picture[]>([])
  const [selectedPicture, setSelectedPicture] = useState<Picture | null>(null)
  const [editingPicture, setEditingPicture] = useState<Picture | null>(null)
  const [searchText, setSearchText] = useState("")
  const [appliedSearchText, setAppliedSearchText] = useState("")
  const [reviewStatus, setReviewStatus] = useState("")
  const [current, setCurrent] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<Notice>(null)
  const [uploadMode, setUploadMode] = useState<"url" | "file">("url")
  const [uploadFileValue, setUploadFileValue] = useState<File | null>(null)
  const [uploadForm, setUploadForm] = useState({
    fileUrl: "",
    name: "",
    introduction: "",
    category: "",
    tagsText: "",
  })

  const loadPictures = useCallback(
    async (page = current) => {
      setLoading(true)
      setNotice(null)
      try {
        const result = await listPicturesForAdmin({
          current: page,
          pageSize: MANAGE_PAGE_SIZE,
          searchText: appliedSearchText || undefined,
          reviewStatus: reviewStatus === "" ? undefined : Number(reviewStatus),
          sortField: "createTime",
          sortOrder: "descend",
        })
        setPictures(result.records ?? [])
        setTotal(result.total ?? 0)
        setCurrent(page)
      } catch (err) {
        setNotice({ type: "error", text: err instanceof Error ? err.message : "图片加载失败" })
      } finally {
        setLoading(false)
      }
    },
    [appliedSearchText, current, reviewStatus],
  )

  useEffect(() => {
    void Promise.resolve().then(() => loadPictures(1))
  }, [loadPictures])

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)

    try {
      const tags = parseTags(uploadForm.tagsText)
      if (uploadMode === "url") {
        await uploadPictureByUrl({
          fileUrl: uploadForm.fileUrl,
          name: uploadForm.name,
          picName: uploadForm.name,
          introduction: uploadForm.introduction,
          category: uploadForm.category,
          tags: JSON.stringify(tags),
        })
      } else {
        if (!uploadFileValue) {
          setNotice({ type: "error", text: "请选择要上传的图片文件" })
          return
        }
        await uploadPictureFile(uploadFileValue, {
          name: uploadForm.name,
          introduction: uploadForm.introduction,
          category: uploadForm.category,
          tags: JSON.stringify(tags),
        })
      }
      setNotice({ type: "success", text: "图片已上传" })
      setUploadForm({ fileUrl: "", name: "", introduction: "", category: "", tagsText: "" })
      setUploadFileValue(null)
      await loadPictures(1)
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "上传失败" })
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("确认删除这张图片？")) return
    try {
      await deletePicture(id)
      setNotice({ type: "success", text: "图片已删除" })
      await loadPictures(1)
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "删除失败" })
    }
  }

  async function handleReview(id: number, status: 1 | 2) {
    try {
      await reviewPicture({
        id,
        reviewStatus: status,
        reviewMessage: status === 1 ? "管理员审核通过" : "管理员审核拒绝",
      })
      setNotice({ type: "success", text: status === 1 ? "图片已通过审核" : "图片已拒绝" })
      await loadPictures(current)
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "审核失败" })
    }
  }

  return (
    <section className="space-y-5">
      <ManagementHeader
        icon={<Images className="size-3.5" />}
        badge="Picture Admin"
        title="图片管理"
        description="管理员可查看全部图片、上传图片、编辑元信息、审核状态和删除图片。"
      />

      <NoticeBox notice={notice} />

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="bg-background">
          <CardHeader>
            <CardTitle className="text-base">上传图片</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleUpload}>
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
                <Button
                  type="button"
                  variant={uploadMode === "url" ? "default" : "ghost"}
                  onClick={() => setUploadMode("url")}
                >
                  URL
                </Button>
                <Button
                  type="button"
                  variant={uploadMode === "file" ? "default" : "ghost"}
                  onClick={() => setUploadMode("file")}
                >
                  文件
                </Button>
              </div>

              {uploadMode === "url" ? (
                <Field label="图片 URL" htmlFor="upload-url">
                  <Input
                    id="upload-url"
                    value={uploadForm.fileUrl}
                    placeholder="https://..."
                    onChange={(event) => setUploadForm({ ...uploadForm, fileUrl: event.target.value })}
                  />
                </Field>
              ) : (
                <Field label="图片文件" htmlFor="upload-file">
                  <Input
                    id="upload-file"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setUploadFileValue(event.target.files?.[0] ?? null)}
                  />
                </Field>
              )}

            <PictureMetaFields form={uploadForm} onChange={(next) => setUploadForm({ ...uploadForm, ...next })} />

              <Button type="submit" className="h-9 w-full">
                <Upload />
                上传
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-background">
          <CardHeader>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <CardTitle className="text-base">图片列表</CardTitle>
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault()
                  setAppliedSearchText(searchText.trim())
                }}
              >
                <SearchInput
                  value={searchText}
                  onChange={setSearchText}
                  placeholder="搜索图片"
                  className="w-full sm:w-64"
                />
                <select
                  className="h-10 rounded-lg border bg-background px-3 text-sm"
                  value={reviewStatus}
                  onChange={(event) => setReviewStatus(event.target.value)}
                >
                  <option value="">全部状态</option>
                  <option value="0">待审核</option>
                  <option value="1">已通过</option>
                  <option value="2">已拒绝</option>
                </select>
                <Button type="submit" className="h-10">
                  搜索
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              loading={loading}
              emptyText="暂无图片"
              columns={["图片", "状态", "尺寸", "创建时间", "操作"]}
            >
              {pictures.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="flex min-w-[260px] items-center gap-3">
                      <button
                        type="button"
                        className="overflow-hidden rounded-lg border bg-muted"
                        onClick={() => setSelectedPicture(item)}
                      >
                        {item.thumbnailUrl || item.url ? (
                          <img
                            src={item.thumbnailUrl || item.url}
                            alt={item.name || "图片"}
                            className="size-14 object-cover"
                          />
                        ) : (
                          <div className="flex size-14 items-center justify-center">
                            <ImageIcon className="size-5 text-muted-foreground" />
                          </div>
                        )}
                      </button>
                      <div>
                        <div className="line-clamp-1 font-medium">{item.name || "未命名图片"}</div>
                        <div className="line-clamp-1 text-xs text-muted-foreground">{item.category || "未分类"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ReviewBadge status={item.reviewStatus} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.picWidth && item.picHeight ? `${item.picWidth} x ${item.picHeight}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(item.createTime)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedPicture(item)}>
                        <Eye />
                        详情
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setEditingPicture(item)}>
                        <Pencil />
                        编辑
                      </Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => handleReview(item.id, 1)}>
                        <Check />
                        通过
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => handleReview(item.id, 2)}>
                        <X />
                        拒绝
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                        <Trash2 />
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
            <Pager
              current={current}
              total={total}
              pageSize={MANAGE_PAGE_SIZE}
              onPageChange={loadPictures}
            />
          </CardContent>
        </Card>
      </div>

      <PictureDetailDialog
        picture={selectedPicture}
        onClose={() => setSelectedPicture(null)}
      />
      <PictureEditDialog
        picture={editingPicture}
        onClose={() => setEditingPicture(null)}
        onSaved={() => loadPictures(current)}
      />
    </section>
  )
}

function PictureCard({
  picture,
  onLike,
  onOpen,
}: {
  picture: Picture
  onLike: (pictureId: number) => void
  onOpen: (picture: Picture) => void
}) {
  const imageUrl = picture.thumbnailUrl || picture.url
  const ratio =
    picture.picWidth && picture.picHeight
      ? `${picture.picWidth} / ${picture.picHeight}`
      : "4 / 3"
  const author = picture.user?.userName || picture.user?.userAccount || "未知用户"

  return (
    <article className="mb-4 break-inside-avoid overflow-hidden rounded-lg border bg-background shadow-xs transition-shadow hover:shadow-md">
      <button type="button" className="block w-full bg-muted text-left" onClick={() => onOpen(picture)}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={picture.name || "图库图片"}
            className="w-full object-cover"
            style={{ aspectRatio: ratio }}
            loading="lazy"
          />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center text-muted-foreground">
            <ImageIcon className="size-8" />
          </div>
        )}
      </button>

      <div className="space-y-3 p-4">
        <div>
          <h2 className="line-clamp-2 text-base font-semibold tracking-normal">
            {picture.name || "未命名图片"}
          </h2>
          {picture.introduction ? (
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {picture.introduction}
            </p>
          ) : null}
        </div>

        {normalizeTags(picture.tags).length ? (
          <div className="flex flex-wrap gap-1.5">
            {normalizeTags(picture.tags)
              .slice(0, 4)
              .map((tag) => (
                <Badge key={tag} variant="muted">
                  {tag}
                </Badge>
              ))}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 pt-1 text-xs text-muted-foreground">
          <div className="min-w-0 truncate">{author}</div>
          <Button
            type="button"
            variant={picture.isLiked ? "secondary" : "ghost"}
            size="sm"
            className={cn("gap-1.5", picture.isLiked && "text-foreground")}
            onClick={() => onLike(picture.id)}
          >
            <Heart className={cn(picture.isLiked && "fill-current")} />
            {picture.likeCount ?? 0}
          </Button>
        </div>
      </div>
    </article>
  )
}

function PictureDetailDialog({
  picture,
  onClose,
}: {
  picture: Picture | null
  onClose: () => void
}) {
  if (!picture) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="max-h-[90svh] w-full max-w-5xl overflow-hidden rounded-lg border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">{picture.name || "图片详情"}</h2>
            <p className="text-sm text-muted-foreground">查看图片元信息和原图预览</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="关闭详情">
            <X />
          </Button>
        </div>

        <div className="grid max-h-[calc(90svh-72px)] overflow-auto lg:grid-cols-[1fr_360px]">
          <div className="flex min-h-[360px] items-center justify-center bg-muted/60 p-4">
            {picture.url ? (
              <img
                src={picture.url}
                alt={picture.name || "图片详情"}
                className="max-h-[70svh] w-full rounded-lg object-contain"
              />
            ) : (
              <ImageIcon className="size-10 text-muted-foreground" />
            )}
          </div>

          <aside className="space-y-5 border-l p-5">
            <div>
              <div className="text-xs text-muted-foreground">简介</div>
              <p className="mt-2 text-sm leading-6">{picture.introduction || "暂无简介"}</p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {normalizeTags(picture.tags).length ? (
                normalizeTags(picture.tags).map((tag) => (
                  <Badge key={tag} variant="muted">
                    {tag}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline">无标签</Badge>
              )}
            </div>

            <div className="grid gap-3 text-sm">
              <InfoRow label="分类" value={picture.category || "未分类"} />
              <InfoRow label="作者" value={picture.user?.userName || picture.user?.userAccount || String(picture.userId ?? "-")} />
              <InfoRow label="尺寸" value={picture.picWidth && picture.picHeight ? `${picture.picWidth} x ${picture.picHeight}` : "-"} />
              <InfoRow label="格式" value={picture.picFormat || "-"} />
              <InfoRow label="大小" value={formatSize(picture.picSize)} />
              <InfoRow label="点赞" value={String(picture.likeCount ?? 0)} />
              <InfoRow label="审核" value={reviewLabels[picture.reviewStatus ?? -1] ?? "-"} />
              <InfoRow label="创建时间" value={formatDate(picture.createTime)} />
            </div>

            {picture.url ? (
              <Button type="button" variant="outline" className="h-10 w-full" onClick={() => window.open(picture.url, "_blank")}>
                查看原图
              </Button>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  )
}

function PictureEditDialog({
  picture,
  onClose,
  onSaved,
}: {
  picture: Picture | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: "",
    introduction: "",
    category: "",
    tagsText: "",
  })
  const [notice, setNotice] = useState<Notice>(null)

  useEffect(() => {
    if (picture) {
      void Promise.resolve().then(() => {
        setForm({
          name: picture.name ?? "",
          introduction: picture.introduction ?? "",
          category: picture.category ?? "",
          tagsText: normalizeTags(picture.tags).join(", "),
        })
        setNotice(null)
      })
    }
  }, [picture])

  if (!picture) return null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!picture) return
    try {
      await updatePicture({
        id: picture.id,
        name: form.name,
        introduction: form.introduction,
        category: form.category,
        tags: parseTags(form.tagsText),
      })
      onSaved()
      onClose()
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "更新失败" })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-xl bg-background shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">编辑图片</CardTitle>
            <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="关闭编辑">
              <X />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <PictureMetaFields form={form} onChange={setForm} />
            <NoticeBox notice={notice} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button type="submit">
                <Check />
                保存
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function PictureMetaFields({
  form,
  onChange,
}: {
  form: { name: string; introduction: string; category: string; tagsText: string }
  onChange: (form: { name: string; introduction: string; category: string; tagsText: string }) => void
}) {
  return (
    <>
      <Field label="名称" htmlFor="picture-name">
        <Input
          id="picture-name"
          value={form.name}
          placeholder="图片名称"
          onChange={(event) => onChange({ ...form, name: event.target.value })}
        />
      </Field>
      <Field label="简介" htmlFor="picture-intro">
        <Input
          id="picture-intro"
          value={form.introduction}
          placeholder="图片简介"
          onChange={(event) => onChange({ ...form, introduction: event.target.value })}
        />
      </Field>
      <Field label="分类" htmlFor="picture-category">
        <Input
          id="picture-category"
          value={form.category}
          placeholder="如 壁纸 / UI / 头像"
          onChange={(event) => onChange({ ...form, category: event.target.value })}
        />
      </Field>
      <Field label="标签" htmlFor="picture-tags">
        <Input
          id="picture-tags"
          value={form.tagsText}
          placeholder="用逗号分隔，如 高清, 自然"
          onChange={(event) => onChange({ ...form, tagsText: event.target.value })}
        />
      </Field>
    </>
  )
}

function ManagementHeader({
  icon,
  badge,
  title,
  description,
}: {
  icon: React.ReactNode
  badge: string
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border bg-background p-5 shadow-xs md:p-6">
      <SectionHeading icon={icon} badge={badge} title={title} description={description} />
    </div>
  )
}

function SectionHeading({
  icon,
  badge,
  title,
  description,
}: {
  icon: React.ReactNode
  badge: string
  title: string
  description: string
}) {
  return (
    <div>
      <Badge variant="outline" className="mb-3 gap-1.5 bg-background">
        {icon}
        {badge}
      </Badge>
      <h1 className="text-3xl font-semibold tracking-normal md:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  )
}

function DataTable({
  loading,
  emptyText,
  columns,
  children,
}: {
  loading: boolean
  emptyText: string
  columns: string[]
  children: React.ReactNode
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-muted/60 text-xs text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <tr key={index} className="border-t">
                <td className="px-4 py-4" colSpan={columns.length}>
                  <Skeleton className="h-8 w-full" />
                </td>
              </tr>
            ))
          ) : children ? (
            children
          ) : (
            <tr>
              <td className="px-4 py-10 text-center text-muted-foreground" colSpan={columns.length}>
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function Pager({
  current,
  total,
  pageSize,
  onPageChange,
}: {
  current: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  const pages = Math.max(Math.ceil(total / pageSize), 1)
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
      <span>
        第 {current} / {pages} 页，共 {total} 条
      </span>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" disabled={current <= 1} onClick={() => onPageChange(current - 1)}>
          <ArrowLeft />
          上一页
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={current >= pages} onClick={() => onPageChange(current + 1)}>
          下一页
          <ArrowRight />
        </Button>
      </div>
    </div>
  )
}

function TagFilter({
  tags,
  selectedTag,
  onSelect,
}: {
  tags: string[]
  selectedTag: string
  onSelect: (tag: string) => void
}) {
  return (
    <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
      {tags.length === 0
        ? Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-16 shrink-0 rounded-lg" />
          ))
        : tags.map((tag) => (
            <Button
              key={tag}
              type="button"
              variant={selectedTag === tag ? "default" : "outline"}
              size="sm"
              className="shrink-0"
              onClick={() => onSelect(tag)}
            >
              {tag}
            </Button>
          ))}
    </div>
  )
}

function StatsCard({
  title,
  stats,
}: {
  title: string
  stats: Array<{ label: string; value: number }>
}) {
  return (
    <Card className="bg-background shadow-xs">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-3 lg:grid-cols-1">
        {stats.map((item) => (
          <div key={item.label} className="rounded-lg border bg-muted/30 p-3">
            <div className="text-2xl font-semibold">{item.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{item.label}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function PermissionView({ title }: { title: string }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border bg-background px-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
        <Shield className="size-6 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">暂无 {title} 权限</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        该页面调用管理员接口，需要当前账号拥有 admin 角色。
      </p>
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border bg-background px-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
        <ImageIcon className="size-6 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  )
}

function PictureSkeletonGrid() {
  return (
    <section className="columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4">
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          className="mb-4 break-inside-avoid overflow-hidden rounded-lg border bg-background p-3"
        >
          <Skeleton
            className={cn(
              "w-full rounded-md",
              index % 3 === 0 ? "h-72" : index % 3 === 1 ? "h-56" : "h-44",
            )}
          />
          <Skeleton className="mt-4 h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </div>
      ))}
    </section>
  )
}

function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
}) {
  return (
    <div className={cn("relative flex-1", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="h-10 pl-9"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

function NoticeBox({ notice, className }: { notice: Notice; className?: string }) {
  if (!notice) return null

  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        notice.type === "error"
          ? "border-destructive/25 bg-destructive/10 text-destructive"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
        className,
      )}
    >
      {notice.text}
    </div>
  )
}

function BrandBlock({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <ImageIcon className="size-5" />
      </div>
      <div>
        <div className="text-sm font-semibold tracking-wide">Nan Picture</div>
        {!compact ? <div className="text-xs text-muted-foreground">公共云图库</div> : null}
      </div>
    </div>
  )
}

function NavButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <Button type="button" variant={active ? "default" : "ghost"} onClick={onClick}>
      {children}
    </Button>
  )
}

function UserIdentity({ user }: { user: LoginUser }) {
  const userLabel = user.userName || user.userAccount || "用户"
  const isAdmin = user.userRole === "admin"
  return (
    <div className="flex items-center gap-2">
      <Avatar className={isAdmin ? "ring-2 ring-primary/30" : ""}>
        {user.userAvatar ? <AvatarImage src={user.userAvatar} alt={userLabel} /> : null}
        <AvatarFallback>{userLabel.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="hidden text-right sm:block">
        <div className="flex items-center justify-end gap-1.5">
          <span className="text-sm font-medium">{userLabel}</span>
          {isAdmin ? (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">管理员</Badge>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
          <UserRound className="size-3" />
          {isAdmin ? "admin" : "user"}
        </div>
      </div>
    </div>
  )
}

function ReviewBadge({ status }: { status?: number }) {
  if (status === 1) return <Badge>已通过</Badge>
  if (status === 2) return <Badge variant="outline">已拒绝</Badge>
  return <Badge variant="secondary">待审核</Badge>
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right font-medium">{value}</span>
    </div>
  )
}

function normalizeTags(tags?: string[] | string) {
  if (!tags) return []
  if (Array.isArray(tags)) return tags.filter(Boolean)

  try {
    const parsed = JSON.parse(tags) as unknown
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : []
  } catch {
    return tags
      .split(/[,，\s]+/)
      .map((tag) => tag.trim())
      .filter(Boolean)
  }
}

function parseTags(text: string) {
  return text
    .split(/[,，\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function formatDate(value?: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatTime(value?: string) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatSize(value?: number) {
  if (!value) return "-"
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

function SpaceView({ onSelectSpace }: { onSelectSpace: (space: SpaceVO) => void }) {
  const [spaces, setSpaces] = useState<SpaceVO[]>([])
  const [spaceLevels, setSpaceLevels] = useState<SpaceLevel[]>([])
  const [selectedSpace, setSelectedSpace] = useState<SpaceVO | null>(null)
  const [editingSpace, setEditingSpace] = useState<SpaceVO | null>(null)
  const [searchText, setSearchText] = useState("")
  const [appliedSearchText, setAppliedSearchText] = useState("")
  const [current, setCurrent] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<Notice>(null)
  const [form, setForm] = useState({ spaceName: "", spaceLevel: 0 })

  const SPACE_PAGE_SIZE = 10

  useEffect(() => {
    listSpaceLevels()
      .then(setSpaceLevels)
      .catch(() => setSpaceLevels([]))
  }, [])

  const loadSpaces = useCallback(
    async (page = current) => {
      setLoading(true)
      setNotice(null)
      try {
        const result = await listSpaces({
          current: page,
          pageSize: SPACE_PAGE_SIZE,
          spaceName: appliedSearchText || undefined,
          sortField: "createTime",
          sortOrder: "descend",
        })
        setSpaces(result.records ?? [])
        setTotal(result.total ?? 0)
        setCurrent(page)
      } catch (err) {
        setNotice({ type: "error", text: err instanceof Error ? err.message : "空间加载失败" })
      } finally {
        setLoading(false)
      }
    },
    [appliedSearchText, current],
  )

  useEffect(() => {
    void Promise.resolve().then(() => loadSpaces(1))
  }, [loadSpaces])

  function resetForm() {
    setEditingSpace(null)
    setForm({ spaceName: "", spaceLevel: 0 })
  }

  function startEdit(space: SpaceVO) {
    setEditingSpace(space)
    setForm({
      spaceName: space.spaceName ?? "",
      spaceLevel: space.spaceLevel ?? 0,
    })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)

    if (!form.spaceName.trim()) {
      setNotice({ type: "error", text: "请输入空间名称" })
      return
    }

    try {
      if (editingSpace) {
        await editSpace({
          id: editingSpace.id,
          spaceName: form.spaceName.trim(),
        })
        setNotice({ type: "success", text: "空间已更新" })
      } else {
        await createSpace({
          spaceName: form.spaceName.trim(),
          spaceLevel: form.spaceLevel,
        })
        setNotice({ type: "success", text: "空间已创建" })
      }
      resetForm()
      await loadSpaces(1)
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "保存失败" })
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("确认删除这个空间？空间内的图片也将无法访问。")) return
    try {
      await deleteSpace(id)
      setNotice({ type: "success", text: "空间已删除" })
      if (selectedSpace?.id === id) {
        setSelectedSpace(null)
      }
      await loadSpaces(1)
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "删除失败" })
    }
  }

  function getLevelLabel(level?: number) {
    const found = spaceLevels.find((l) => l.value === level)
    return found?.text ?? (level === 0 ? "普通版" : `等级${level}`)
  }

  const stats = useMemo(
    () => [
      { label: "空间总数", value: total },
      { label: "当前展示", value: spaces.length },
      { label: "等级选项", value: spaceLevels.length },
    ],
    [spaces.length, total, spaceLevels.length],
  )

  return (
    <>
      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border bg-background p-5 shadow-xs md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              badge="Space Management"
              icon={<FolderOpen className="size-3.5" />}
              title="空间管理"
              description="创建和管理你的图片空间。每个空间可以独立存储和管理图片资产。"
            />
            <form
              className="flex w-full gap-2 lg:w-[360px]"
              onSubmit={(event) => {
                event.preventDefault()
                setAppliedSearchText(searchText.trim())
              }}
            >
              <SearchInput
                value={searchText}
                onChange={setSearchText}
                placeholder="搜索空间名称"
              />
              <Button className="h-10 px-4" type="submit">
                搜索
              </Button>
            </form>
          </div>
        </div>

        <StatsCard title="空间概览" stats={stats} />
      </section>

      <NoticeBox notice={notice} className="mt-5" />
      <Separator className="my-6" />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="bg-background">
          <CardHeader>
            <CardTitle className="text-base">
              {editingSpace ? "编辑空间" : "创建空间"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Field label="空间名称" htmlFor="space-name">
                <Input
                  id="space-name"
                  value={form.spaceName}
                  placeholder="请输入空间名称"
                  onChange={(event) =>
                    setForm({ ...form, spaceName: event.target.value })
                  }
                />
              </Field>

              {!editingSpace ? (
                <Field label="空间等级" htmlFor="space-level">
                  <select
                    id="space-level"
                    className="h-9 w-full rounded-lg border bg-background px-3 text-sm"
                    value={form.spaceLevel}
                    onChange={(event) =>
                      setForm({ ...form, spaceLevel: Number(event.target.value) })
                    }
                  >
                    {spaceLevels.length === 0 ? (
                      <>
                        <option value={0}>普通版</option>
                        <option value={1}>专业版</option>
                        <option value={2}>旗舰版</option>
                      </>
                    ) : (
                      spaceLevels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.text}（{level.maxCount} 张 / {formatSize(level.maxSize)}）
                        </option>
                      ))
                    )}
                  </select>
                </Field>
              ) : null}

              <div className="flex gap-2">
                <Button type="submit" className="h-9 flex-1">
                  {editingSpace ? <Check /> : <Plus />}
                  {editingSpace ? "保存" : "创建"}
                </Button>
                {editingSpace ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9"
                    onClick={resetForm}
                  >
                    取消
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-background">
          <CardHeader>
            <CardTitle className="text-base">空间列表</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              loading={loading}
              emptyText="暂无空间，请创建一个"
              columns={["空间", "等级", "用量", "创建时间", "操作"]}
            >
              {spaces.map((space) => (
                <tr
                  key={space.id}
                  className={cn(
                    "border-t cursor-pointer hover:bg-muted/50",
                    selectedSpace?.id === space.id && "bg-muted/30",
                  )}
                  onClick={() => onSelectSpace(space)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{space.spaceName}</div>
                    <div className="text-xs text-muted-foreground">
                      {space.user?.userName || space.user?.userAccount || `用户${space.userId}`}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{getLevelLabel(space.spaceLevel)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="text-xs">
                      图片: {space.totalCount ?? 0} / {space.maxCount ?? "-"}
                    </div>
                    <div className="text-xs">
                      容量: {formatSize(space.totalSize)} / {formatSize(space.maxSize)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(space.createTime)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          startEdit(space)
                        }}
                      >
                        <Pencil />
                        编辑
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(space.id)
                        }}
                      >
                        <Trash2 />
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
            <Pager
              current={current}
              total={total}
              pageSize={SPACE_PAGE_SIZE}
              onPageChange={loadSpaces}
            />
          </CardContent>
        </Card>
      </div>

      {selectedSpace ? (
        <SpacePictureView
          space={selectedSpace}
          spaceLevels={spaceLevels}
          onClose={() => setSelectedSpace(null)}
        />
      ) : null}
    </>
  )
}

function MySpaceView({ userId }: { userId: number }) {
  const [spaces, setSpaces] = useState<SpaceVO[]>([])
  const [spaceLevels, setSpaceLevels] = useState<SpaceLevel[]>([])
  const [activeSpaceId, setActiveSpaceId] = useState<number | null>(null)
  const [loadingSpaces, setLoadingSpaces] = useState(true)
  const [notice, setNotice] = useState<Notice>(null)

  useEffect(() => {
    listSpaceLevels()
      .then(setSpaceLevels)
      .catch(() => setSpaceLevels([]))
  }, [])

  const loadSpaces = useCallback(async () => {
    setLoadingSpaces(true)
    setNotice(null)
    try {
      const result = await listSpaces({
        current: 1,
        pageSize: 20,
        userId,
        sortField: "createTime",
        sortOrder: "descend",
      })
      const records = result.records ?? []
      setSpaces(records)
      if (records.length > 0 && activeSpaceId === null) {
        setActiveSpaceId(records[0].id)
      }
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "空间加载失败" })
    } finally {
      setLoadingSpaces(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(() => loadSpaces())
  }, [loadSpaces])

  const activeSpace = spaces.find((s) => s.id === activeSpaceId) ?? null

  if (loadingSpaces) {
    return (
      <section>
        <SectionHeading
          badge="My Spaces"
          icon={<FolderOpen className="size-3.5" />}
          title="我的空间"
          description="你的个人空间图片库，可直接浏览和上传图片。"
        />
        <Separator className="my-6" />
        <PictureSkeletonGrid />
      </section>
    )
  }

  if (spaces.length === 0) {
    return (
      <>
        <section className="rounded-lg border bg-background p-5 shadow-xs md:p-6">
          <SectionHeading
            badge="My Spaces"
            icon={<FolderOpen className="size-3.5" />}
            title="我的空间"
            description="你的个人空间图片库，可直接浏览和上传图片。"
          />
        </section>
        <NoticeBox notice={notice} className="mt-5" />
        <Separator className="my-6" />
        <EmptyState title="暂无空间" description="你还没有创建任何空间。请联系管理员创建空间。" />
      </>
    )
  }

  return (
    <>
      <section className="rounded-lg border bg-background p-5 shadow-xs md:p-6">
        <SectionHeading
          badge="My Spaces"
          icon={<FolderOpen className="size-3.5" />}
          title="我的空间"
          description="你的个人空间图片库，可直接浏览和上传图片。"
        />

        {spaces.length > 1 ? (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {spaces.map((space) => (
              <Button
                key={space.id}
                type="button"
                variant={activeSpaceId === space.id ? "default" : "outline"}
                size="sm"
                className="shrink-0"
                onClick={() => setActiveSpaceId(space.id)}
              >
                {space.spaceName}
              </Button>
            ))}
          </div>
        ) : null}
      </section>

      <NoticeBox notice={notice} className="mt-5" />

      {activeSpace ? (
        <MySpacePictureView
          key={activeSpace.id}
          space={activeSpace}
          spaceLevels={spaceLevels}
        />
      ) : null}
    </>
  )
}

function MySpacePictureView({
  space,
  spaceLevels,
}: {
  space: SpaceVO
  spaceLevels: SpaceLevel[]
}) {
  const [pictures, setPictures] = useState<Picture[]>([])
  const [selectedPicture, setSelectedPicture] = useState<Picture | null>(null)
  const [current, setCurrent] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [uploadMode, setUploadMode] = useState<"url" | "file">("file")
  const [uploadFileValue, setUploadFileValue] = useState<File | null>(null)
  const [uploadForm, setUploadForm] = useState({
    fileUrl: "",
    name: "",
    introduction: "",
    category: "",
    tagsText: "",
  })

  const hasMore = pictures.length < total || (total === 0 && pictures.length >= PAGE_SIZE)

  const loadPictures = useCallback(
    async (page: number, replace = false) => {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setNotice(null)

      try {
        const result = await listPicturesBySpace({
          current: page,
          pageSize: PAGE_SIZE,
          spaceId: space.id,
        })

        setPictures((previous) =>
          replace ? result.records ?? [] : [...previous, ...(result.records ?? [])],
        )
        setTotal(result.total ?? 0)
        setCurrent(page)
      } catch (err) {
        setNotice({
          type: "error",
          text: err instanceof Error ? err.message : "图片加载失败",
        })
        if (replace) {
          setPictures([])
          setTotal(0)
        }
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [space.id],
  )

  useEffect(() => {
    void Promise.resolve().then(() => loadPictures(1, true))
  }, [loadPictures])

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)

    try {
      const tags = parseTags(uploadForm.tagsText)
      if (uploadMode === "url") {
        await uploadPictureToSpaceByUrl({
          fileUrl: uploadForm.fileUrl,
          spaceId: space.id,
          name: uploadForm.name,
          picName: uploadForm.name,
          introduction: uploadForm.introduction,
          category: uploadForm.category,
          tags: JSON.stringify(tags),
        })
      } else {
        if (!uploadFileValue) {
          setNotice({ type: "error", text: "请选择要上传的图片文件" })
          return
        }
        await uploadPictureToSpace(uploadFileValue, {
          spaceId: space.id,
          name: uploadForm.name,
          introduction: uploadForm.introduction,
          category: uploadForm.category,
          tags: JSON.stringify(tags),
        })
      }
      setNotice({ type: "success", text: "图片已上传" })
      setUploadForm({ fileUrl: "", name: "", introduction: "", category: "", tagsText: "" })
      setUploadFileValue(null)
      await loadPictures(1, true)
    } catch (err) {
      setNotice({
        type: "error",
        text: err instanceof Error ? err.message : "上传失败",
      })
    }
  }

  async function handleLike(pictureId: number) {
    try {
      const isLiked = await likePicture(pictureId)
      setPictures((items) =>
        items.map((item) =>
          item.id === pictureId
            ? {
                ...item,
                isLiked,
                likeCount: Math.max((item.likeCount ?? 0) + (isLiked ? 1 : -1), 0),
              }
            : item,
        ),
      )
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "点赞失败" })
    }
  }

  async function openDetail(picture: Picture) {
    setSelectedPicture(picture)
    try {
      const detail = await getPictureVO(picture.id)
      setSelectedPicture(detail)
    } catch {
      setSelectedPicture(picture)
    }
  }

  function getLevelLabel(level?: number) {
    const found = spaceLevels.find((l) => l.value === level)
    return found?.text ?? (level === 0 ? "普通版" : `等级${level}`)
  }

  return (
    <>
      <Separator className="my-6" />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline">{getLevelLabel(space.spaceLevel)}</Badge>
          <span className="text-sm text-muted-foreground">
            图片 {space.totalCount ?? 0}/{space.maxCount ?? "-"} · 容量 {formatSize(space.totalSize)}/{formatSize(space.maxSize)}
          </span>
        </div>
      </div>

      <NoticeBox notice={notice} />

      <details className="mt-4 rounded-lg border bg-background p-5 shadow-xs md:p-6">
        <summary className="cursor-pointer text-base font-medium">
          上传图片到 {space.spaceName}
        </summary>

        <form className="mt-4 space-y-4" onSubmit={handleUpload}>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
            <Button
              type="button"
              variant={uploadMode === "file" ? "default" : "ghost"}
              onClick={() => setUploadMode("file")}
            >
              文件
            </Button>
            <Button
              type="button"
              variant={uploadMode === "url" ? "default" : "ghost"}
              onClick={() => setUploadMode("url")}
            >
              URL
            </Button>
          </div>

          {uploadMode === "url" ? (
            <Field label="图片 URL" htmlFor="my-space-upload-url">
              <Input
                id="my-space-upload-url"
                value={uploadForm.fileUrl}
                placeholder="https://..."
                onChange={(event) =>
                  setUploadForm({ ...uploadForm, fileUrl: event.target.value })
                }
              />
            </Field>
          ) : (
            <Field label="图片文件" htmlFor="my-space-upload-file">
              <Input
                id="my-space-upload-file"
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setUploadFileValue(event.target.files?.[0] ?? null)
                }
              />
            </Field>
          )}

          <PictureMetaFields
            form={uploadForm}
            onChange={(next) => setUploadForm({ ...uploadForm, ...next })}
          />

          <Button type="submit" className="h-9 w-full">
            <Upload />
            上传到空间
          </Button>
        </form>
      </details>

      <Separator className="my-6" />

      {loading ? (
        <PictureSkeletonGrid />
      ) : pictures.length === 0 ? (
        <EmptyState title="空间暂无图片" description="上传图片到此空间，开始构建你的专属图库。" />
      ) : (
        <>
          <section className="columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4">
            {pictures.map((picture) => (
              <PictureCard
                key={picture.id}
                picture={picture}
                onLike={handleLike}
                onOpen={openDetail}
              />
            ))}
          </section>

          <div className="flex justify-center py-8">
            {hasMore ? (
              <Button
                variant="outline"
                className="h-10"
                disabled={loadingMore}
                onClick={() => loadPictures(current + 1)}
              >
                {loadingMore ? <Loader2 className="animate-spin" /> : null}
                加载更多
              </Button>
            ) : (
              <span className="text-sm text-muted-foreground">已显示全部图片</span>
            )}
          </div>
        </>
      )}

      <PictureDetailDialog
        picture={selectedPicture}
        onClose={() => setSelectedPicture(null)}
      />
    </>
  )
}

function SpaceDetailView({
  space,
  onBack,
}: {
  space: SpaceVO
  onBack: () => void
}) {
  const [spaceLevels, setSpaceLevels] = useState<SpaceLevel[]>([])

  useEffect(() => {
    listSpaceLevels()
      .then(setSpaceLevels)
      .catch(() => setSpaceLevels([]))
  }, [])

  return (
    <SpacePictureView
      space={space}
      spaceLevels={spaceLevels}
      onClose={onBack}
    />
  )
}

function SpacePictureView({
  space,
  spaceLevels,
  onClose,
}: {
  space: SpaceVO
  spaceLevels: SpaceLevel[]
  onClose: () => void
}) {
  const [pictures, setPictures] = useState<Picture[]>([])
  const [selectedPicture, setSelectedPicture] = useState<Picture | null>(null)
  const [current, setCurrent] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [uploadMode, setUploadMode] = useState<"url" | "file">("file")
  const [uploadFileValue, setUploadFileValue] = useState<File | null>(null)
  const [uploadForm, setUploadForm] = useState({
    fileUrl: "",
    name: "",
    introduction: "",
    category: "",
    tagsText: "",
  })

  const hasMore = pictures.length < total || (total === 0 && pictures.length >= PAGE_SIZE)

  const loadPictures = useCallback(
    async (page: number, replace = false) => {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setNotice(null)

      try {
        const result = await listPicturesBySpace({
          current: page,
          pageSize: PAGE_SIZE,
          spaceId: space.id,
        })

        setPictures((previous) =>
          replace ? result.records ?? [] : [...previous, ...(result.records ?? [])],
        )
        setTotal(result.total ?? 0)
        setCurrent(page)
      } catch (err) {
        setNotice({
          type: "error",
          text: err instanceof Error ? err.message : "图片加载失败",
        })
        if (replace) {
          setPictures([])
          setTotal(0)
        }
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [space.id],
  )

  useEffect(() => {
    void Promise.resolve().then(() => loadPictures(1, true))
  }, [loadPictures])

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)

    try {
      const tags = parseTags(uploadForm.tagsText)
      if (uploadMode === "url") {
        await uploadPictureToSpaceByUrl({
          fileUrl: uploadForm.fileUrl,
          spaceId: space.id,
          name: uploadForm.name,
          picName: uploadForm.name,
          introduction: uploadForm.introduction,
          category: uploadForm.category,
          tags: JSON.stringify(tags),
        })
      } else {
        if (!uploadFileValue) {
          setNotice({ type: "error", text: "请选择要上传的图片文件" })
          return
        }
        await uploadPictureToSpace(uploadFileValue, {
          spaceId: space.id,
          name: uploadForm.name,
          introduction: uploadForm.introduction,
          category: uploadForm.category,
          tags: JSON.stringify(tags),
        })
      }
      setNotice({ type: "success", text: "图片已上传" })
      setUploadForm({ fileUrl: "", name: "", introduction: "", category: "", tagsText: "" })
      setUploadFileValue(null)
      await loadPictures(1, true)
    } catch (err) {
      setNotice({
        type: "error",
        text: err instanceof Error ? err.message : "上传失败",
      })
    }
  }

  async function handleLike(pictureId: number) {
    try {
      const isLiked = await likePicture(pictureId)
      setPictures((items) =>
        items.map((item) =>
          item.id === pictureId
            ? {
                ...item,
                isLiked,
                likeCount: Math.max((item.likeCount ?? 0) + (isLiked ? 1 : -1), 0),
              }
            : item,
        ),
      )
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "点赞失败" })
    }
  }

  async function openDetail(picture: Picture) {
    setSelectedPicture(picture)
    try {
      const detail = await getPictureVO(picture.id)
      setSelectedPicture(detail)
    } catch {
      setSelectedPicture(picture)
    }
  }

  function getLevelLabel(level?: number) {
    const found = spaceLevels.find((l) => l.value === level)
    return found?.text ?? (level === 0 ? "普通版" : `等级${level}`)
  }

  const stats = useMemo(
    () => [
      { label: "当前展示", value: pictures.length },
      { label: "空间图片总数", value: total },
      { label: "空间等级", value: 0 },
    ],
    [pictures.length, total],
  )

  return (
    <>
      <Separator className="my-6" />

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border bg-background p-5 shadow-xs md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                >
                  <ArrowLeft />
                  返回空间列表
                </Button>
              </div>
              <Badge variant="outline" className="mt-3 mb-3 gap-1.5 bg-background">
                <FolderOpen className="size-3.5" />
                Space Gallery
              </Badge>
              <h1 className="text-3xl font-semibold tracking-normal md:text-4xl">
                {space.spaceName}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                等级：{getLevelLabel(space.spaceLevel)} · 图片 {space.totalCount ?? 0} / {space.maxCount ?? "-"} · 容量 {formatSize(space.totalSize)} / {formatSize(space.maxSize)}
              </p>
            </div>
          </div>
        </div>

        <StatsCard title="空间统计" stats={stats} />
      </section>

      <NoticeBox notice={notice} className="mt-5" />

      <details className="mt-5 rounded-lg border bg-background p-5 shadow-xs md:p-6">
        <summary className="cursor-pointer text-base font-semibold">
          上传图片到 {space.spaceName}
        </summary>

        <form className="mt-4 space-y-4" onSubmit={handleUpload}>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
            <Button
              type="button"
              variant={uploadMode === "file" ? "default" : "ghost"}
              onClick={() => setUploadMode("file")}
            >
              文件
            </Button>
            <Button
              type="button"
              variant={uploadMode === "url" ? "default" : "ghost"}
              onClick={() => setUploadMode("url")}
            >
              URL
            </Button>
          </div>

          {uploadMode === "url" ? (
            <Field label="图片 URL" htmlFor="space-upload-url">
              <Input
                id="space-upload-url"
                value={uploadForm.fileUrl}
                placeholder="https://..."
                onChange={(event) =>
                  setUploadForm({ ...uploadForm, fileUrl: event.target.value })
                }
              />
            </Field>
          ) : (
            <Field label="图片文件" htmlFor="space-upload-file">
              <Input
                id="space-upload-file"
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setUploadFileValue(event.target.files?.[0] ?? null)
                }
              />
            </Field>
          )}

          <PictureMetaFields
            form={uploadForm}
            onChange={(next) => setUploadForm({ ...uploadForm, ...next })}
          />

          <Button type="submit" className="h-9 w-full">
            <Upload />
            上传到空间
          </Button>
        </form>
      </details>

      <Separator className="my-6" />

      {loading ? (
        <PictureSkeletonGrid />
      ) : pictures.length === 0 ? (
        <EmptyState title="空间暂无图片" description="上传图片到此空间，开始构建你的专属图库。" />
      ) : (
        <>
          <section className="columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4">
            {pictures.map((picture) => (
              <PictureCard
                key={picture.id}
                picture={picture}
                onLike={handleLike}
                onOpen={openDetail}
              />
            ))}
          </section>

          <div className="flex justify-center py-8">
            {hasMore ? (
              <Button
                variant="outline"
                className="h-10"
                disabled={loadingMore}
                onClick={() => loadPictures(current + 1)}
              >
                {loadingMore ? <Loader2 className="animate-spin" /> : null}
                加载更多
              </Button>
            ) : (
              <span className="text-sm text-muted-foreground">已显示全部图片</span>
            )}
          </div>
        </>
      )}

      <PictureDetailDialog
        picture={selectedPicture}
        onClose={() => setSelectedPicture(null)}
      />
    </>
  )
}

function ProfileView({
  user,
  onUserUpdate,
  onBack,
}: {
  user: LoginUser
  onUserUpdate: (user: LoginUser) => void
  onBack: () => void
}) {
  const [form, setForm] = useState({
    userName: user.userName ?? "",
    userAvatar: user.userAvatar ?? "",
    userProfile: user.userProfile ?? "",
  })
  const [notice, setNotice] = useState<Notice>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    setSaving(true)
    try {
      await updateUser({
        id: user.id,
        userName: form.userName.trim() || undefined,
        userAvatar: form.userAvatar.trim() || undefined,
        userProfile: form.userProfile.trim() || undefined,
      })
      setNotice({ type: "success", text: "个人信息已更新" })
      // refetch user info
      try {
        const updated = await getLoginUser()
        onUserUpdate(updated)
      } catch {}
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "保存失败" })
    } finally {
      setSaving(false)
    }
  }

  const isAdmin = user.userRole === "admin"
  const userLabel = user.userName || user.userAccount || "用户"

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft />
          返回
        </Button>
      </div>

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card className="bg-background">
            <CardHeader className="text-center">
              <Avatar className="mx-auto size-20">
                {form.userAvatar ? (
                  <AvatarImage src={form.userAvatar} alt={userLabel} />
                ) : null}
                <AvatarFallback className="text-2xl">
                  {userLabel.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="mt-3">{userLabel}</CardTitle>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">@{user.userAccount}</span>
                {isAdmin ? (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">管理员</Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">角色</span>
                <span className="font-medium">{isAdmin ? "管理员" : "普通用户"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">注册时间</span>
                <span className="font-medium">{formatDate(user.createTime)}</span>
              </div>
              {user.userProfile ? (
                <div className="rounded-lg bg-muted/40 p-3 text-muted-foreground">
                  {user.userProfile}
                </div>
              ) : (
                <div className="rounded-lg bg-muted/40 p-3 text-center text-xs text-muted-foreground">
                  暂无个人简介
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-background">
          <CardHeader>
            <CardTitle className="text-lg">编辑资料</CardTitle>
            <p className="text-sm text-muted-foreground">修改你的昵称、头像和个人简介。</p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Field label="昵称" htmlFor="profile-name">
                <Input
                  id="profile-name"
                  value={form.userName}
                  placeholder="请输入昵称"
                  onChange={(event) =>
                    setForm({ ...form, userName: event.target.value })
                  }
                />
              </Field>

              <Field label="头像 URL" htmlFor="profile-avatar">
                <Input
                  id="profile-avatar"
                  value={form.userAvatar}
                  placeholder="https://..."
                  onChange={(event) =>
                    setForm({ ...form, userAvatar: event.target.value })
                  }
                />
              </Field>

              <Field label="个人简介" htmlFor="profile-bio">
                <textarea
                  id="profile-bio"
                  className="h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none"
                  value={form.userProfile}
                  placeholder="介绍一下自己..."
                  onChange={(event) =>
                    setForm({ ...form, userProfile: event.target.value })
                  }
                />
              </Field>

              <NoticeBox notice={notice} />

              <Button type="submit" className="h-9 w-full" disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : <Check />}
                保存修改
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </>
  )
}

export default App
