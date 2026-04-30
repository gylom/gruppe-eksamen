import { useRef, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { Pencil, Plus } from "lucide-react"
import { toast } from "sonner"

import { SwipeActionRow } from "~/components/SwipeActionRow"
import { DetailSheet } from "~/components/detail-sheet"
import { RouteErrorRetry } from "~/components/route-error-retry"
import { Button, buttonVariants } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { useCompleteShoppingTrip } from "~/features/shopping/use-complete-shopping-trip"
import { useCreateShoppingItem } from "~/features/shopping/use-create-shopping-item"
import { useShoppingCompletionPreview } from "~/features/shopping/use-shopping-completion-preview"
import { useMaaleenheterLookup } from "~/features/shopping/use-maaleenheter-lookup"
import { usePurchaseShoppingItem } from "~/features/shopping/use-purchase-shopping-item"
import { usePurchasedShoppingList } from "~/features/shopping/use-purchased-shopping-list"
import { useRestoreShoppingItem } from "~/features/shopping/use-restore-shopping-item"
import { useShoppingList } from "~/features/shopping/use-shopping-list"
import { useUpdateShoppingItem } from "~/features/shopping/use-update-shopping-item"
import { useVaretyperLookup } from "~/features/shopping/use-varetyper-lookup"
import type { ActiveShoppingListRow } from "~/features/shopping/types"
import { ApiError } from "~/lib/api-fetch"
import { getDateLocaleTag } from "~/lib/i18n"
import { cn } from "~/lib/utils"

const SHOP_ITEM_SHEET_TITLE_ID = "shop-item-sheet-title"
const SHOP_COMPLETE_SHEET_TITLE_ID = "shop-complete-sheet-title"

const selectStyles = cn(
  "h-9 w-full min-w-0 rounded-4xl border border-input bg-input/30 px-3 py-1 text-base transition-colors outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
)

function sourceKindLabel(kilde: string, t: TFunction): string {
  if (kilde === "plannedMeal") return t("shop.fromPlan")
  return t("shop.manual")
}

function formatQuantityLine(row: ActiveShoppingListRow, t: TFunction): string {
  if (row.kvantitet == null) return t("shop.noAmount")
  const u = row.maaleenhet?.trim() ? ` ${row.maaleenhet}` : ""
  return `${row.kvantitet}${u}`
}

function itemDisplayName(row: ActiveShoppingListRow): string {
  const n = row.varenavn?.trim()
  if (n) return n
  return row.varetype
}

function formatPurchasedAt(iso: string | null, localeTag: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleString(localeTag, { dateStyle: "short", timeStyle: "short" })
}

type ShopListView = "active" | "purchased"
type ShopFormError = {
  field: "type" | "unit" | "quantity"
  message: string
}

export default function ShopRoute() {
  const { t, i18n } = useTranslation()
  const dateLoc = getDateLocaleTag(i18n.language)
  const [listView, setListView] = useState<ShopListView>("active")
  const listQuery = useShoppingList()
  const purchasedQuery = usePurchasedShoppingList(true)
  const [completeSheetOpen, setCompleteSheetOpen] = useState(false)
  const previewQuery = useShoppingCompletionPreview(completeSheetOpen)
  const completeTrip = useCompleteShoppingTrip()
  const varetyperQuery = useVaretyperLookup()
  const maaleenheterQuery = useMaaleenheterLookup()
  const createItem = useCreateShoppingItem()
  const updateItem = useUpdateShoppingItem()
  const purchaseItem = usePurchaseShoppingItem()
  const restoreItem = useRestoreShoppingItem()

  const addButtonRef = useRef<HTMLButtonElement | null>(null)
  const returnFocusRef = useRef<HTMLButtonElement | null>(null)
  const completeTripReturnFocusRef = useRef<HTMLButtonElement | null>(null)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<"add" | "edit">("add")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [varetypeIdStr, setVaretypeIdStr] = useState("")
  const [maaleenhetIdStr, setMaaleenhetIdStr] = useState("")
  const [kvantitetStr, setKvantitetStr] = useState("")
  const [formError, setFormError] = useState<ShopFormError | null>(null)
  const [editingKilde, setEditingKilde] = useState<string | null>(null)
  const [editingVareId, setEditingVareId] = useState<number | null>(null)
  const [editingVaretypeId, setEditingVaretypeId] = useState<number | null>(
    null
  )
  const [pendingPurchaseIds, setPendingPurchaseIds] = useState<Set<number>>(
    () => new Set()
  )
  const [pendingRestoreIds, setPendingRestoreIds] = useState<Set<number>>(
    () => new Set()
  )

  const lookupsLoading = varetyperQuery.isLoading || maaleenheterQuery.isLoading
  const lookupsError = varetyperQuery.isError || maaleenheterQuery.isError
  const lookupsRefetching =
    varetyperQuery.isFetching || maaleenheterQuery.isFetching

  function openAdd(trigger?: HTMLButtonElement) {
    if (trigger) returnFocusRef.current = trigger
    else returnFocusRef.current = addButtonRef.current
    setSheetMode("add")
    setEditingId(null)
    setEditingKilde(null)
    setEditingVareId(null)
    setEditingVaretypeId(null)
    setVaretypeIdStr("")
    setMaaleenhetIdStr("")
    setKvantitetStr("")
    setFormError(null)
    setSheetOpen(true)
  }

  function openEdit(row: ActiveShoppingListRow, trigger: HTMLButtonElement) {
    returnFocusRef.current = trigger
    setSheetMode("edit")
    setEditingId(row.id)
    setEditingKilde(row.kilde)
    setEditingVareId(row.vareId)
    setEditingVaretypeId(row.varetypeId)
    setVaretypeIdStr(String(row.varetypeId))
    setMaaleenhetIdStr(row.maaleenhetId != null ? String(row.maaleenhetId) : "")
    setKvantitetStr(row.kvantitet != null ? String(row.kvantitet) : "")
    setFormError(null)
    setSheetOpen(true)
  }

  function closeSheet(open: boolean) {
    setSheetOpen(open)
    if (!open) setFormError(null)
  }

  function addPendingId(
    setter: Dispatch<SetStateAction<Set<number>>>,
    id: number
  ) {
    setter((current) => {
      const next = new Set(current)
      next.add(id)
      return next
    })
  }

  function removePendingId(
    setter: Dispatch<SetStateAction<Set<number>>>,
    id: number
  ) {
    setter((current) => {
      const next = new Set(current)
      next.delete(id)
      return next
    })
  }

  function purchaseRow(id: number) {
    if (pendingPurchaseIds.has(id)) return
    addPendingId(setPendingPurchaseIds, id)
    purchaseItem.mutate(id, {
      onSuccess: () => toast.success(t("shop.markedPurchased")),
      onError: (err) =>
        toast.error(
          err instanceof ApiError
            ? t("shop.toastPurchaseError")
            : t("common.genericError")
        ),
      onSettled: () => removePendingId(setPendingPurchaseIds, id),
    })
  }

  function restoreRow(id: number) {
    if (pendingRestoreIds.has(id)) return
    addPendingId(setPendingRestoreIds, id)
    restoreItem.mutate(id, {
      onSuccess: () => toast.success(t("shop.restored")),
      onError: (err) =>
        toast.error(
          err instanceof ApiError
            ? t("shop.toastRestoreError")
            : t("common.genericError")
        ),
      onSettled: () => removePendingId(setPendingRestoreIds, id),
    })
  }

  function parseQuantity(
    raw: string
  ): { ok: true; value: number | null } | { ok: false; message: string } {
    const s = raw.trim()
    if (s.length === 0) return { ok: true, value: null }
    const normalized = s.replace(",", ".")
    const n = Number(normalized)
    if (!Number.isFinite(n))
      return { ok: false, message: t("shop.qtyMustBeNumber") }
    if (n < 0) return { ok: false, message: t("shop.qtyNonNegative") }
    return { ok: true, value: n }
  }

  function saveItem() {
    setFormError(null)
    const qtyResult = parseQuantity(kvantitetStr)
    if (!qtyResult.ok) {
      setFormError({ field: "quantity", message: qtyResult.message })
      return
    }
    const varetypeId = Number(varetypeIdStr)
    if (!varetypeIdStr || Number.isNaN(varetypeId) || varetypeId < 1) {
      setFormError({ field: "type", message: t("shop.pickItemType") })
      return
    }
    const maaleenhetId = maaleenhetIdStr === "" ? null : Number(maaleenhetIdStr)
    if (maaleenhetIdStr !== "" && Number.isNaN(maaleenhetId)) {
      setFormError({ field: "unit", message: t("shop.invalidUnit") })
      return
    }

    const body = {
      varetypeId,
      kvantitet: qtyResult.value,
      maaleenhetId,
      vareId:
        sheetMode === "edit" && editingVaretypeId === varetypeId
          ? editingVareId
          : null,
    }

    const onError = (err: unknown) => {
      toast.error(
        err instanceof ApiError
          ? t("shop.toastFormError")
          : t("common.genericError")
      )
    }

    if (sheetMode === "add") {
      createItem.mutate(body, {
        onSuccess: () => {
          toast.success(t("shop.toastItemAdded"))
          setSheetOpen(false)
        },
        onError,
      })
      return
    }

    if (editingId == null) return
    updateItem.mutate(
      { id: editingId, body },
      {
        onSuccess: () => {
          toast.success(t("shop.toastItemUpdated"))
          setSheetOpen(false)
        },
        onError,
      }
    )
  }

  const sheetTitle =
    sheetMode === "add" ? t("shop.addSheetTitle") : t("shop.editSheetTitle")
  const sheetDescription =
    sheetMode === "edit" && editingKilde === "plannedMeal"
      ? t("shop.sheetEditPlanHint")
      : undefined

  const list = listQuery.data?.varer ?? []
  const listEmpty = listQuery.isSuccess && list.length === 0
  const listLoading = listQuery.isLoading

  const purchasedList = purchasedQuery.data?.varer ?? []
  const purchasedCount = purchasedList.length
  const purchasedEmpty = purchasedQuery.isSuccess && purchasedCount === 0
  const showCompleteTrip =
    purchasedQuery.isSuccess && (purchasedCount > 0 || listView === "purchased")
  const purchasedLoading = listView === "purchased" && purchasedQuery.isLoading

  return (
    <div className="flex min-h-0 flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">
              {t("shop.title")}
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {listView === "active"
                ? t("shop.subtitleActive")
                : t("shop.subtitlePurchased")}
            </p>
          </div>
          {listView === "active" ? (
            <Button
              ref={addButtonRef}
              type="button"
              size="sm"
              className="shrink-0 gap-1"
              onClick={() => openAdd(addButtonRef.current ?? undefined)}
            >
              <Plus className="size-4" aria-hidden />
              {t("shop.addShort")}
            </Button>
          ) : (
            <span className="shrink-0" aria-hidden />
          )}
        </div>
        <div
          role="tablist"
          aria-label={t("shop.viewToggle")}
          className="mt-3 flex gap-1 rounded-xl border border-border bg-muted/30 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={listView === "active"}
            className={cn(
              "min-h-9 min-w-0 flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
              listView === "active"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setListView("active")}
          >
            {t("shop.tabActive")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={listView === "purchased"}
            className={cn(
              "min-h-9 min-w-0 flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
              listView === "purchased"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setListView("purchased")}
          >
            {t("shop.tabPurchased")}
          </button>
        </div>
        {showCompleteTrip ? (
          <div className="mt-3">
            <Button
              ref={completeTripReturnFocusRef}
              type="button"
              variant="secondary"
              size="sm"
              className="min-h-10 w-full rounded-2xl font-medium"
              disabled={purchasedCount === 0}
              onClick={() => setCompleteSheetOpen(true)}
            >
              {t("shop.completeTripCta")}
            </Button>
          </div>
        ) : null}
      </header>

      <div className="flex-1 px-4 pt-4 pb-6">
        {listView === "active" && listQuery.isError ? (
          <RouteErrorRetry
            title={t("shop.loadError")}
            hint={t("shop.loadErrorHint")}
            retryLabel={t("common.retry")}
            busy={listQuery.isFetching}
            onRetry={() => void listQuery.refetch()}
          />
        ) : null}

        {listView === "active" && listLoading && !listQuery.isError ? (
          <ul
            className="space-y-2"
            aria-busy="true"
            aria-label={t("common.loading")}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <li
                key={i}
                className="h-[4.25rem] animate-pulse rounded-xl bg-muted/60"
              />
            ))}
          </ul>
        ) : null}

        {listView === "active" && listQuery.isSuccess && listEmpty ? (
          <section
            className="flex min-h-[280px] flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-10 text-center"
            aria-label={t("shop.emptyAria")}
          >
            <div className="max-w-xs space-y-2">
              <p className="text-base font-medium text-foreground">
                {t("shop.emptyTitle")}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("shop.emptyActiveHint")}
              </p>
            </div>
            <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={() => openAdd()}
              >
                {t("shop.addItem")}
              </Button>
              <Link
                to="/app/plan"
                className={buttonVariants({
                  variant: "outline",
                  className:
                    "inline-flex min-h-11 w-full justify-center rounded-2xl sm:w-auto",
                })}
              >
                {t("shop.emptyGotoPlan")}
              </Link>
            </div>
          </section>
        ) : null}

        {listView === "active" && listQuery.isSuccess && !listEmpty ? (
          <ul className="space-y-2">
            {list.map((row) => {
              const name = itemDisplayName(row)
              const rowPurchasePending = pendingPurchaseIds.has(row.id)
              return (
                <li
                  key={row.id}
                  className="overflow-hidden rounded-xl border border-border/80 bg-card/50 shadow-sm"
                >
                  <SwipeActionRow
                    actionLabel={t("shop.markPurchased")}
                    fallbackAriaLabel={t("shop.purchaseAria", { name })}
                    loading={rowPurchasePending}
                    disabled={rowPurchasePending}
                    onAction={() => purchaseRow(row.id)}
                  >
                    <div className="flex min-w-0 gap-2 pr-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
                            {formatQuantityLine(row, t)}
                          </span>
                          <span className="min-w-0 text-sm leading-snug font-medium break-words">
                            {name}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/80">
                            {sourceKindLabel(row.kilde, t)}
                          </span>
                          <span aria-hidden> · </span>
                          <span>{row.brukernavn}</span>
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                        aria-label={t("shop.editRow", { name })}
                        disabled={rowPurchasePending}
                        onClick={(e) => openEdit(row, e.currentTarget)}
                      >
                        <Pencil className="size-4" aria-hidden />
                      </Button>
                    </div>
                  </SwipeActionRow>
                </li>
              )
            })}
          </ul>
        ) : null}

        {listView === "purchased" && purchasedQuery.isError ? (
          <RouteErrorRetry
            title={t("shop.purchasedLoadError")}
            hint={t("shop.loadErrorHint")}
            retryLabel={t("common.retry")}
            busy={purchasedQuery.isFetching}
            onRetry={() => void purchasedQuery.refetch()}
          />
        ) : null}

        {listView === "purchased" &&
        purchasedLoading &&
        !purchasedQuery.isError ? (
          <ul
            className="space-y-2"
            aria-busy="true"
            aria-label={t("shop.loadingPurchased")}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <li
                key={i}
                className="h-[4.25rem] animate-pulse rounded-xl bg-muted/60"
              />
            ))}
          </ul>
        ) : null}

        {listView === "purchased" &&
        purchasedQuery.isSuccess &&
        purchasedEmpty ? (
          <section
            className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-10 text-center"
            aria-label={t("shop.purchasedEmptyAria")}
          >
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("shop.purchasedExplainer")}
            </p>
          </section>
        ) : null}

        {listView === "purchased" &&
        purchasedQuery.isSuccess &&
        !purchasedEmpty ? (
          <ul className="space-y-2">
            {purchasedList.map((row) => {
              const name = itemDisplayName(row)
              const rowRestorePending = pendingRestoreIds.has(row.id)
              const boughtLine = formatPurchasedAt(row.purchasedAt, dateLoc)
              return (
                <li
                  key={row.id}
                  className="overflow-hidden rounded-xl border border-border/80 bg-card/50 shadow-sm"
                >
                  <SwipeActionRow
                    actionLabel={t("shop.restore")}
                    fallbackAriaLabel={t("shop.restoreAria", { name })}
                    loading={rowRestorePending}
                    disabled={rowRestorePending}
                    onAction={() => restoreRow(row.id)}
                  >
                    <div className="min-w-0 pr-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
                          {formatQuantityLine(row, t)}
                        </span>
                        <span className="min-w-0 text-sm leading-snug font-medium break-words">
                          {name}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">
                          {sourceKindLabel(row.kilde, t)}
                        </span>
                        <span aria-hidden> · </span>
                        <span>{row.brukernavn}</span>
                      </p>
                      <p className="mt-1 text-xs font-medium text-foreground">
                        <span className="rounded-md border border-border bg-muted/50 px-1.5 py-0.5">
                          {t("shop.purchasedBadge")}
                          {boughtLine ? ` · ${boughtLine}` : ""}
                        </span>
                      </p>
                    </div>
                  </SwipeActionRow>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>

      <DetailSheet
        open={sheetOpen}
        onOpenChange={closeSheet}
        labelledById={SHOP_ITEM_SHEET_TITLE_ID}
        title={sheetTitle}
        description={sheetDescription}
        returnFocusRef={returnFocusRef}
        footer={
          <div className="flex w-full gap-2 px-1">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 flex-1 rounded-2xl"
              disabled={createItem.isPending || updateItem.isPending}
              onClick={() => closeSheet(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              className="min-h-11 flex-1 rounded-2xl"
              disabled={
                lookupsLoading ||
                lookupsError ||
                createItem.isPending ||
                updateItem.isPending
              }
              onClick={() => saveItem()}
            >
              {createItem.isPending || updateItem.isPending
                ? t("shop.sheetSaving")
                : t("common.save")}
            </Button>
          </div>
        }
      >
        {lookupsError ? (
          <div className="space-y-3" role="alert">
            <p className="text-sm text-destructive">
              {t("shop.lookupsFailed")}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-2xl"
              disabled={lookupsRefetching}
              aria-busy={lookupsRefetching}
              onClick={() => {
                if (varetyperQuery.isError) void varetyperQuery.refetch()
                if (maaleenheterQuery.isError) void maaleenheterQuery.refetch()
              }}
            >
              {t("shop.retryLookups")}
            </Button>
          </div>
        ) : lookupsLoading ? (
          <div className="space-y-3" aria-busy="true">
            <div className="h-9 animate-pulse rounded-4xl bg-muted" />
            <div className="h-9 animate-pulse rounded-4xl bg-muted" />
            <div className="h-9 animate-pulse rounded-4xl bg-muted" />
          </div>
        ) : (
          <div className="space-y-4">
            {formError ? (
              <p className="text-sm text-destructive" role="alert">
                {formError.message}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="shop-varetype">{t("shop.typeLabel")}</Label>
              <select
                id="shop-varetype"
                className={selectStyles}
                value={varetypeIdStr}
                aria-invalid={formError?.field === "type" ? true : undefined}
                onChange={(e) => setVaretypeIdStr(e.target.value)}
              >
                <option value="">{t("shop.selectTypePlaceholder")}</option>
                {(varetyperQuery.data ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.varetype}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-maaleenhet">{t("shop.unitLabel")}</Label>
              <select
                id="shop-maaleenhet"
                className={selectStyles}
                value={maaleenhetIdStr}
                aria-invalid={formError?.field === "unit" ? true : undefined}
                onChange={(e) => setMaaleenhetIdStr(e.target.value)}
              >
                <option value="">{t("shop.unitNone")}</option>
                {(maaleenheterQuery.data ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.enhet}
                    {m.type ? ` (${m.type})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-kvantitet">{t("shop.qtyLabel")}</Label>
              <Input
                id="shop-kvantitet"
                inputMode="decimal"
                autoComplete="off"
                placeholder={t("shop.qtyPlaceholder")}
                value={kvantitetStr}
                onChange={(e) => setKvantitetStr(e.target.value)}
                aria-invalid={
                  formError?.field === "quantity" ? true : undefined
                }
              />
            </div>
          </div>
        )}
      </DetailSheet>

      <DetailSheet
        open={completeSheetOpen}
        onOpenChange={setCompleteSheetOpen}
        labelledById={SHOP_COMPLETE_SHEET_TITLE_ID}
        title={t("shop.completeTitle")}
        description={t("shop.completeDescription")}
        returnFocusRef={completeTripReturnFocusRef}
        footer={
          <div className="flex w-full gap-2 px-1">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 flex-1 rounded-2xl"
              disabled={completeTrip.isPending}
              onClick={() => setCompleteSheetOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              className="min-h-11 flex-1 rounded-2xl"
              disabled={
                completeTrip.isPending ||
                previewQuery.isLoading ||
                previewQuery.isFetching ||
                previewQuery.isError ||
                !previewQuery.data ||
                previewQuery.data.archiveRowCount < 1
              }
              onClick={() =>
                completeTrip.mutate(undefined, {
                  onSuccess: (data) => {
                    setCompleteSheetOpen(false)
                    if (data.archiveRowCount > 0) {
                      toast.success(t("shop.tripCompleted"))
                    } else {
                      toast.info(t("shop.nothingToArchive"))
                    }
                  },
                  onError: (err) =>
                    toast.error(
                      err instanceof ApiError
                        ? t("shop.toastCompleteError")
                        : t("common.genericError")
                    ),
                })
              }
            >
              {completeTrip.isPending
                ? t("shop.completing")
                : t("shop.confirm")}
            </Button>
          </div>
        }
      >
        {previewQuery.isLoading ? (
          <div className="space-y-3" aria-busy="true">
            <div className="h-10 animate-pulse rounded-xl bg-muted/80" />
            <div className="h-10 animate-pulse rounded-xl bg-muted/80" />
            <div className="h-10 animate-pulse rounded-xl bg-muted/80" />
          </div>
        ) : previewQuery.isError ? (
          <div className="space-y-3" role="alert">
            <p className="text-sm text-destructive">
              {t("shop.previewFailed")}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-2xl"
              onClick={() => void previewQuery.refetch()}
            >
              {t("common.retry")}
            </Button>
          </div>
        ) : previewQuery.data ? (
          <ul className="list-none space-y-3 text-sm leading-snug text-foreground">
            <li className="rounded-xl border border-border/80 bg-muted/20 px-3 py-2.5">
              <span className="font-medium text-foreground">
                {t("shop.previewArchiveLabel")}
              </span>
              <span className="mt-0.5 block text-muted-foreground tabular-nums">
                {previewQuery.data.archiveRowCount}{" "}
                {previewQuery.data.archiveRowCount === 1
                  ? t("shop.rowSingular")
                  : t("shop.rowPlural")}
              </span>
            </li>
            <li className="rounded-xl border border-border/80 bg-muted/20 px-3 py-2.5">
              <span className="font-medium text-foreground">
                {t("shop.previewCookbookLabel")}
              </span>
              <span className="mt-0.5 block text-muted-foreground tabular-nums">
                {previewQuery.data.cookbookMealCount}{" "}
                {previewQuery.data.cookbookMealCount === 1
                  ? t("shop.mealSingular")
                  : t("shop.mealPlural")}
              </span>
            </li>
            <li className="rounded-xl border border-border/80 bg-muted/20 px-3 py-2.5">
              <span className="font-medium text-foreground">
                {t("shop.previewActiveLabel")}
              </span>
              <span className="mt-0.5 block text-muted-foreground tabular-nums">
                {previewQuery.data.remainingActiveRowCount}{" "}
                {previewQuery.data.remainingActiveRowCount === 1
                  ? t("shop.rowSingular")
                  : t("shop.rowPlural")}
              </span>
            </li>
          </ul>
        ) : null}
      </DetailSheet>
    </div>
  )
}
