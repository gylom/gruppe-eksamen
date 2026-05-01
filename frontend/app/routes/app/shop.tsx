import { useRef, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { Pencil, Plus } from "lucide-react"
import { toast } from "sonner"

import { Checkbox } from "~/components/ui/checkbox"
import { DetailSheet } from "~/components/detail-sheet"
import { RouteHeader } from "~/components/route-header"
import { RouteErrorRetry } from "~/components/route-error-retry"
import { Button, buttonVariants } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { useCompleteShoppingTrip } from "~/features/shopping/use-complete-shopping-trip"
import { useCreateShoppingItem } from "~/features/shopping/use-create-shopping-item"
import { useMaaleenheterLookup } from "~/features/shopping/use-maaleenheter-lookup"
import { usePurchaseShoppingItem } from "~/features/shopping/use-purchase-shopping-item"
import { usePurchasedShoppingList } from "~/features/shopping/use-purchased-shopping-list"
import { useRestoreShoppingItem } from "~/features/shopping/use-restore-shopping-item"
import { useShoppingList } from "~/features/shopping/use-shopping-list"
import { useUpdateShoppingItem } from "~/features/shopping/use-update-shopping-item"
import { useVaretyperLookup } from "~/features/shopping/use-varetyper-lookup"
import type { ActiveShoppingListRow } from "~/features/shopping/types"
import { ApiError } from "~/lib/api-fetch"
import { cn } from "~/lib/utils"

const SHOP_ITEM_SHEET_TITLE_ID = "shop-item-sheet-title"
const SHOP_COMPLETE_SHEET_TITLE_ID = "shop-complete-sheet-title"

const UNIT_NONE_VALUE = "__none__"

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

type ShopFormError = {
  field: "type" | "unit" | "quantity"
  message: string
}

export default function ShopRoute() {
  const { t } = useTranslation()
  const listQuery = useShoppingList()
  const purchasedQuery = usePurchasedShoppingList(true)
  const [completeSheetOpen, setCompleteSheetOpen] = useState(false)
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

  const activeList = listQuery.data?.varer ?? []
  const purchasedList = purchasedQuery.data?.varer ?? []
  const purchasedCount = purchasedList.length
  const combinedList: Array<{
    row: ActiveShoppingListRow
    purchased: boolean
  }> = [
    ...activeList.map((row) => ({ row, purchased: false })),
    ...purchasedList.map((row) => ({ row, purchased: true })),
  ]
  const totalCount = combinedList.length
  const listEmpty =
    listQuery.isSuccess && purchasedQuery.isSuccess && totalCount === 0
  const listLoading = listQuery.isLoading || purchasedQuery.isLoading
  const listError = listQuery.isError || purchasedQuery.isError
  const listFetching = listQuery.isFetching || purchasedQuery.isFetching
  const showCompleteTrip = purchasedQuery.isSuccess && purchasedCount > 0

  function retryLists() {
    if (listQuery.isError) void listQuery.refetch()
    if (purchasedQuery.isError) void purchasedQuery.refetch()
  }

  return (
    <section className="px-4 pb-4" aria-label={t("shop.title")}>
      <RouteHeader
        title={t("shop.title")}
        action={
          showCompleteTrip ? (
            <Button
              ref={completeTripReturnFocusRef}
              type="button"
              size="sm"
              className="shrink-0"
              onClick={() => setCompleteSheetOpen(true)}
            >
              {t("shop.completeTripCta")}
            </Button>
          ) : undefined
        }
        actionSpacerClassName="h-9"
      />

      <div className="mx-auto mt-6 max-w-2xl">
        {listError ? (
          <RouteErrorRetry
            title={t("shop.loadError")}
            hint={t("shop.loadErrorHint")}
            retryLabel={t("common.retry")}
            busy={listFetching}
            onRetry={retryLists}
          />
        ) : null}

        {listLoading && !listError ? (
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

        {!listError && !listLoading && listEmpty ? (
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
                size="lg"
                className="min-h-11 w-full justify-center rounded-[21px] sm:w-auto"
                onClick={() => openAdd()}
              >
                {t("shop.addItem")}
              </Button>
              <Link
                to="/app/meals"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className:
                    "min-h-11 w-full justify-center rounded-2xl sm:w-auto",
                })}
              >
                {t("shop.emptyGotoPlan")}
              </Link>
            </div>
          </section>
        ) : null}

        {!listError && !listLoading && !listEmpty ? (
          <ul className="space-y-2">
            {combinedList.map(({ row, purchased }) => {
              const name = itemDisplayName(row)
              const inputId = `shop-row-${row.id}`
              const pending = purchased
                ? pendingRestoreIds.has(row.id)
                : pendingPurchaseIds.has(row.id)
              return (
                <li
                  key={`${purchased ? "p" : "a"}-${row.id}`}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border border-border/80 bg-card/50 p-3 shadow-sm transition-colors",
                    purchased && "opacity-70"
                  )}
                >
                  <label
                    htmlFor={inputId}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                  >
                    <Checkbox
                      id={inputId}
                      className="shrink-0"
                      checked={purchased}
                      disabled={pending}
                      onCheckedChange={(next) => {
                        if (next === true && !purchased) purchaseRow(row.id)
                        else if (next === false && purchased) restoreRow(row.id)
                      }}
                      aria-label={
                        purchased
                          ? t("shop.restoreAria", { name })
                          : t("shop.purchaseAria", { name })
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span
                          className={cn(
                            "shrink-0 text-sm font-semibold text-foreground tabular-nums",
                            purchased && "text-muted-foreground line-through"
                          )}
                        >
                          {formatQuantityLine(row, t)}
                        </span>
                        <span
                          className={cn(
                            "min-w-0 text-sm leading-snug font-medium break-words",
                            purchased && "text-muted-foreground line-through"
                          )}
                        >
                          {name}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {sourceKindLabel(row.kilde, t)}
                      </p>
                    </div>
                  </label>
                  {!purchased ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label={t("shop.editRow", { name })}
                      disabled={pending}
                      onClick={(e) => openEdit(row, e.currentTarget)}
                    >
                      <Pencil className="size-4" aria-hidden />
                    </Button>
                  ) : null}
                </li>
              )
            })}
            <li>
              <button
                ref={addButtonRef}
                type="button"
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 p-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                onClick={() => openAdd(addButtonRef.current ?? undefined)}
              >
                <span
                  className="flex size-4 shrink-0 items-center justify-center rounded-[6px] border border-input"
                  aria-hidden
                >
                  <Plus className="size-3.5" />
                </span>
                <span>{t("shop.addItem")}</span>
              </button>
            </li>
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
              <Select
                value={varetypeIdStr}
                onValueChange={(v) => setVaretypeIdStr(v ?? "")}
              >
                <SelectTrigger
                  id="shop-varetype"
                  className="w-full rounded-4xl"
                  aria-invalid={formError?.field === "type" ? true : undefined}
                >
                  <SelectValue placeholder={t("shop.selectTypePlaceholder")}>
                    {(value) => {
                      if (value == null || value === "") {
                        return t("shop.selectTypePlaceholder")
                      }
                      const id = Number(value)
                      const v = (varetyperQuery.data ?? []).find(
                        (v) => v.id === id
                      )
                      return v?.varetype ?? t("shop.selectTypePlaceholder")
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(varetyperQuery.data ?? []).map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.varetype}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-maaleenhet">{t("shop.unitLabel")}</Label>
              <Select
                value={
                  maaleenhetIdStr === "" ? UNIT_NONE_VALUE : maaleenhetIdStr
                }
                onValueChange={(v) =>
                  setMaaleenhetIdStr(
                    v == null || v === UNIT_NONE_VALUE ? "" : v
                  )
                }
              >
                <SelectTrigger
                  id="shop-maaleenhet"
                  className="w-full rounded-4xl"
                  aria-invalid={formError?.field === "unit" ? true : undefined}
                >
                  <SelectValue placeholder={t("shop.unitNone")}>
                    {(value) => {
                      if (value == null || value === UNIT_NONE_VALUE) {
                        return t("shop.unitNone")
                      }
                      const id = Number(value)
                      const m = (maaleenheterQuery.data ?? []).find(
                        (m) => m.id === id
                      )
                      if (!m) return t("shop.unitNone")
                      return `${m.enhet}${m.type ? ` (${m.type})` : ""}`
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNIT_NONE_VALUE}>
                    {t("shop.unitNone")}
                  </SelectItem>
                  {(maaleenheterQuery.data ?? []).map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.enhet}
                      {m.type ? ` (${m.type})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              disabled={completeTrip.isPending}
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
        <></>
      </DetailSheet>
    </section>
  )
}
