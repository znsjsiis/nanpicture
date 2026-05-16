const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api"

export type ApiResponse<T> = {
  code: number
  data: T
  message?: string
}

export type LoginUser = {
  id: number
  userAccount: string
  userName?: string
  userAvatar?: string
  userProfile?: string
  userRole?: string
  createTime?: string
  updateTime?: string
}

export type UserVO = {
  id: number
  userAccount: string
  userName?: string
  userAvatar?: string
  userProfile?: string
  userRole?: string
  createTime?: string
}

export type PictureUser = {
  id: number
  userAccount?: string
  userName?: string
  userAvatar?: string
  userProfile?: string
  userRole?: string
}

export type Picture = {
  id: number
  url: string
  thumbnailUrl?: string
  name?: string
  introduction?: string
  tags?: string[] | string
  category?: string
  picSize?: number
  picWidth?: number
  picHeight?: number
  picScale?: number
  picFormat?: string
  userId?: number
  user?: PictureUser
  spaceId?: number
  likeCount?: number
  isLiked?: boolean
  reviewStatus?: number
  reviewMessage?: string
  reviewerId?: number
  reviewTime?: string
  createTime?: string
  editTime?: string
  updateTime?: string
}

export type PageResult<T> = {
  records: T[]
  total: number
  size: number
  current: number
  pages?: number
}

export type SpaceVO = {
  id: number
  spaceName?: string
  spaceLevel?: number
  maxSize?: number
  maxCount?: number
  totalSize?: number
  totalCount?: number
  userId?: number
  user?: UserVO
  createTime?: string
  editTime?: string
  updateTime?: string
}

export type SpaceLevel = {
  value?: number
  text?: string
  maxCount?: number
  maxSize?: number
}

export type SpaceQuery = {
  current: number
  pageSize: number
  id?: number
  userId?: number
  spaceName?: string
  spaceLevel?: number
  sortField?: string
  sortOrder?: "ascend" | "descend"
}

export type PictureQuery = {
  current: number
  pageSize: number
  searchText?: string
  name?: string
  tags?: string[]
  category?: string
  reviewStatus?: number
  spaceId?: number
  sortField?: string
  sortOrder?: "ascend" | "descend"
}

export type UserQuery = {
  current: number
  pageSize: number
  userAccount?: string
  userName?: string
  userRole?: string
  sortField?: string
  sortOrder?: "ascend" | "descend"
}

export type TagCategory = {
  tagList?: string[]
  categoryList?: string[]
}

function jsonHeaders(init?: RequestInit) {
  if (init?.body instanceof FormData) {
    return init.headers
  }

  return {
    "Content-Type": "application/json",
    ...init?.headers,
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: jsonHeaders(init),
  })

  if (!response.ok) {
    throw new Error(`请求失败 (${response.status})`)
  }

  const payload = (await response.json()) as ApiResponse<T>

  if (payload.code !== 0) {
    throw new Error(payload.message || "接口返回异常")
  }

  return payload.data
}

export function login(userAccount: string, userPassword: string) {
  return request<LoginUser>("/user/login", {
    method: "POST",
    body: JSON.stringify({ userAccount, userPassword }),
  })
}

export function register(userAccount: string, userPassword: string, checkPassword: string) {
  return request<number>("/user/register", {
    method: "POST",
    body: JSON.stringify({ userAccount, userPassword, checkPassword }),
  })
}

export function logout() {
  return request<boolean>("/user/logout", {
    method: "POST",
  })
}

export function getLoginUser() {
  return request<LoginUser>("/user/get/login")
}

export function listUsers(query: UserQuery) {
  return request<PageResult<UserVO>>("/user/list/page/vo", {
    method: "POST",
    body: JSON.stringify(query),
  })
}

export function addUser(payload: {
  userAccount: string
  userName?: string
  userAvatar?: string
  userProfile?: string
  userRole?: string
}) {
  return request<number>("/user/add", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateUser(payload: {
  id: number
  userName?: string
  userAvatar?: string
  userProfile?: string
  userRole?: string
}) {
  return request<boolean>("/user/update", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function deleteUser(id: number) {
  return request<boolean>("/user/delete", {
    method: "POST",
    body: JSON.stringify({ id }),
  })
}

export function listPublicPictures(query: PictureQuery) {
  return request<PageResult<Picture>>("/picture/list/page/vo", {
    method: "POST",
    body: JSON.stringify(query),
  })
}

export function listPicturesForAdmin(query: PictureQuery) {
  return request<PageResult<Picture>>("/picture/list/page", {
    method: "POST",
    body: JSON.stringify(query),
  })
}

export function getPictureVO(id: number) {
  return request<Picture>(`/picture/get/vo?id=${id}`)
}

export function getPictureForAdmin(id: number) {
  return request<Picture>(`/picture/get?id=${id}`)
}

export function getPictureTagCategory() {
  return request<TagCategory>("/picture/tag_category")
}

export function likePicture(pictureId: number) {
  return request<boolean>(`/picture/like?id=${pictureId}`, {
    method: "POST",
  })
}

export function updatePicture(payload: {
  id: number
  name?: string
  introduction?: string
  category?: string
  tags?: string[]
}) {
  return request<boolean>("/picture/update", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function deletePicture(id: number) {
  return request<boolean>("/picture/delete", {
    method: "POST",
    body: JSON.stringify({ id }),
  })
}

export function reviewPicture(payload: {
  id: number
  reviewStatus: 1 | 2
  reviewMessage?: string
}) {
  return request<boolean>("/picture/review", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function uploadPictureByUrl(payload: {
  fileUrl: string
  name?: string
  picName?: string
  introduction?: string
  category?: string
  tags?: string
}) {
  return request<Picture>("/picture/upload/url", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function uploadPictureFile(
  file: File,
  payload: {
    name?: string
    introduction?: string
    category?: string
    tags?: string
  },
) {
  const formData = new FormData()
  formData.append("file", file)

  Object.entries(payload).forEach(([key, value]) => {
    if (value) {
      formData.append(key, value)
    }
  })

  return request<Picture>("/picture/upload", {
    method: "POST",
    body: formData,
  })
}

export function listSpaces(query: SpaceQuery) {
  return request<PageResult<SpaceVO>>("/space/list/page/vo", {
    method: "POST",
    body: JSON.stringify(query),
  })
}

export function getSpaceVO(id: number) {
  return request<SpaceVO>(`/space/get/vo?id=${id}`)
}

export function createSpace(payload: { spaceName: string; spaceLevel?: number }) {
  return request<number>("/space/add", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function editSpace(payload: { id: number; spaceName?: string }) {
  return request<boolean>("/space/edit", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function deleteSpace(id: number) {
  return request<boolean>("/space/delete", {
    method: "POST",
    body: JSON.stringify({ id }),
  })
}

export function listSpaceLevels() {
  return request<SpaceLevel[]>("/space/list/level")
}

// 按空间查询图片（复用 picture/list/page/vo，传 spaceId）
export function listPicturesBySpace(query: PictureQuery) {
  return request<PageResult<Picture>>("/picture/list/page/vo", {
    method: "POST",
    body: JSON.stringify(query),
  })
}

export function uploadPictureToSpace(
  file: File,
  payload: {
    spaceId: number
    name?: string
    introduction?: string
    category?: string
    tags?: string
  },
) {
  const formData = new FormData()
  formData.append("file", file)

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value))
    }
  })

  return request<Picture>("/picture/upload", {
    method: "POST",
    body: formData,
  })
}

export function uploadPictureToSpaceByUrl(payload: {
  fileUrl: string
  spaceId: number
  name?: string
  picName?: string
  introduction?: string
  category?: string
  tags?: string
}) {
  return request<Picture>("/picture/upload/url", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function chatWithGalleryAssistant(message: string) {
  const body = new URLSearchParams()
  body.set("message", message)
  body.set(
    "systemPrompt",
    [
      "你是 Nan Picture 图库项目的智能助手。",
      "你可以帮助用户理解图库功能、图片管理、用户管理、审核流程、上传规范、搜索和标签使用。",
      "回答要简洁、具体、偏产品操作指导。如果用户询问项目外内容，可以礼貌回答但优先回到图库使用场景。",
    ].join("\n"),
  )

  return request<string>("/doubao/chatWithPrompt", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body,
  })
}
