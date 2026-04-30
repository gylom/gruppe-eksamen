import { useRef, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { Pencil, Plus } from "lucide-react"
import { toast } from "sonner"

import { SwipeActionRow } from "~/components/SwipeActionRow"
import { DetailSheet } from "~/components/detail-sheet"
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
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
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
  const [formError, setFormError] = useState<string | null>(null)
  const [editingKilde, setEditingKilde] = useState<string | null>(null)
  const [editingVareId, setEditingVareId] = useState<number | null>(null)
  const [editingVaretypeId, setEditingVaretypeId] = useState<number | null>(null)
  const [pendingPurchaseIds, setPendingPurchaseIds] = useState<Set<number>>(() => new Set())
  const [pendingRestoreIds, setPendingRestoreIds] = useState<Set<number>>(() => new Set())

  const lookupsLoading = varetyperQuery.isLoading || maaleenheterQuery.isLoading
  const lookupsError = varetyperQuery.isError || maaleenheterQuery.isError

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

  function addPendingId(setter: Dispatch<SetStateAction<Set<number>>>, id: number) {
    setter((current) => {
      const next = new Set(current)
      next.add(id)
      return next
    })
  }

  function removePendingId(setter: Dispatch<SetStateAction<Set<number>>>, id: number) {
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
      onSuccess: () => toast.success("Markert som kjøpt"),
      onError: (err) =>
        toast.error(
          err instanceof ApiError ? err.message : "Noe gikk galt. Prøv igjen.",
        ),
      onSettled: () => removePendingId(setPendingPurchaseIds, id),
    })
  }

  function restoreRow(id: number) {
    if (pendingRestoreIds.has(id)) return
    addPendingId(setPendingRestoreIds, id)
    restoreItem.mutate(id, {
      onSuccess: () => toast.success("Lagt tilbake på listen"),
      onError: (err) =>
        toast.error(
          err instanceof ApiError ? err.message : "Noe gikk galt. Prøv igjen.",
        ),
      onSettled: () => removePendingId(setPendingRestoreIds, id),
    })
  }

  function parseQuantity(raw: string): { ok: true; value: number | null } | { ok: false; message: string } {
    const t = raw.trim()
    if (t.length === 0) return { ok: true, value: null }
    const normalized = t.replace(",", ".")
    const n = Number(normalized)
    if (!Number.isFinite(n)) return { ok: false, message: "Mengde må være et tall." }
    if (n < 0) return { ok: false, message: "Mengde kan ikke være negativ." }
    return { ok: true, value: n }
  }

  function saveItem() {
    setFormError(null)
    const qtyResult = parseQuantity(kvantitetStr)
    if (!qtyResult.ok) {
      setFormError(qtyResult.message)
      return
    }
    const varetypeId = Number(varetypeIdStr)
    if (!varetypeIdStr || Number.isNaN(varetypeId) || varetypeId < 1) {
      setFormError("Velg varetype.")
      return
    }
    const maaleenhetId = maaleenhetIdStr === "" ? null : Number(maaleenhetIdStr)
    if (maaleenhetIdStr !== "" && Number.isNaN(maaleenhetId)) {
      setFormError("Ugyldig måleenhet.")
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
      const msg =
        err instanceof ApiError ? err.message : "Noe gikk galt. Prøv igjen."
      toast.error(msg)
    }

    if (sheetMode === "add") {
      createItem.mutate(body, {
        onSuccess: () => {
          toast.success("Vare lagt til")
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
          toast.success("Vare oppdatert")
          setSheetOpen(false)
        },
        onError,
      },
    )
  }

  const sheetTitle = sheetMode === "add" ? "Legg til vare" : "Rediger vare"
  const sheetDescription =
    sheetMode === "edit" && editingKilde === "plannedMeal"
      ? "Rader fra ukesplanen beholder kobling til måltidene når du lagrer."
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
            <h1 className="text-xl font-semibold tracking-tight">{t("shop.title")}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {listView === "active" ? t("shop.subtitleActive") : t("shop.subtitlePurchased")}
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
              listView === "active"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
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
              listView === "purchased"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
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
              className="w-full min-h-10 rounded-2xl font-medium"
              disabled={purchasedCount === 0}
              onClick={() => setCompleteSheetOpen(true)}
            >
              {t("shop.completeTripCta")}
            </Button>
          </div>
        ) : null}
      </header>

      <div className="flex-1 px-4 pb-6 pt-4">
        {listView === "active" && listQuery.isError ? (
          <section
            className="flex min-h-[220px] flex-col justify-center gap-4 rounded-xl border border-border bg-card/40 p-4"
            aria-live="polite"
          >
            <div>
              <h2 className="text-base font-medium">{t("shop.loadError")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("shop.loadErrorHint")}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              disabled={listQuery.isFetching}
              onClick={() => void listQuery.refetch()}
            >
              {t("common.retry")}
            </Button>
          </section>
        ) : null}

        {listView === "active" && listLoading && !listQuery.isError ? (
          <ul className="space-y-2" aria-hidden>
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
            aria-label="Tom handleliste"
          >
            <div className="max-w-xs space-y-2">
              <p className="text-base font-medium text-foreground">Ingenting her ennå</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Legg til det du trenger, eller hent forslag fra ukens plan under Plan.
              </p>
            </div>
            <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row sm:justify-center">
              <Button type="button" className="w-full sm:w-auto" onClick={() => openAdd()}>
                Legg til vare
              </Button>
              <Link
                to="/app/plan"
                className={buttonVariants({
                  variant: "outline",
                  className: "inline-flex w-full min-h-11 justify-center rounded-2xl sm:w-auto",
                })}
              >
                Gå til plan
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
                    actionLabel="Kjøpt"
                    fallbackAriaLabel={`Marker ${name} som kjøpt`}
                    loading={rowPurchasePending}
                    disabled={rowPurchasePending}
                    onAction={() => purchaseRow(row.id)}
                  >
                    <div className="flex min-w-0 gap-2 pr-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                            {formatQuantityLine(row, t)}
                          </span>
                          <span className="min-w-0 break-words text-sm font-medium leading-snug">
                            {name}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/80">{sourceKindLabel(row.kilde, t)}</span>
                          <span aria-hidden> · </span>
                          <span>{row.brukernavn}</span>
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                        aria-label={`Rediger ${name}`}
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
          <section
            className="flex min-h-[220px] flex-col justify-center gap-4 rounded-xl border border-border bg-card/40 p-4"
            aria-live="polite"
          >
            <div>
              <h2 className="text-base font-medium">Kunne ikke laste kjøpte varer</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sjekk nettverket og prøv på nytt.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              disabled={purchasedQuery.isFetching}
              onClick={() => void purchasedQuery.refetch()}
            >
              Prøv igjen
            </Button>
          </section>
        ) : null}

        {listView === "purchased" && purchasedLoading && !purchasedQuery.isError ? (
          <ul className="space-y-2" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="h-[4.25rem] animate-pulse rounded-xl bg-muted/60" />
            ))}
          </ul>
        ) : null}

        {listView === "purchased" && purchasedQuery.isSuccess && purchasedEmpty ? (
          <section
            className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-10 text-center"
            aria-label="Ingen kjøpte varer"
          >
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Her vises varer du krysser av mens du handler. Du kan gjenopprette til den aktive listen, eller fullføre
              handleturen når du er ferdig.
            </p>
          </section>
        ) : null}

        {listView === "purchased" && purchasedQuery.isSuccess && !purchasedEmpty ? (
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
                    actionLabel="Gjenopprett"
                    fallbackAriaLabel={`Gjenopprett ${name} til aktiv liste`}
                    loading={rowRestorePending}
                    disabled={rowRestorePending}
                    onAction={() => restoreRow(row.id)}
                  >
                    <div className="min-w-0 pr-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                          {formatQuantityLine(row, t)}
                        </span>
                        <span className="min-w-0 break-words text-sm font-medium leading-snug">{name}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">{sourceKindLabel(row.kilde, t)}</span>
                        <span aria-hidden> · </span>
                        <span>{row.brukernavn}</span>
                      </p>
                      <p className="mt-1 text-xs font-medium text-foreground">
                        <span className="rounded-md border border-border bg-muted/50 px-1.5 py-0.5">
                          Kjøpt{boughtLine ? ` · ${boughtLine}` : ""}
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
              Avbryt
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
              {createItem.isPending || updateItem.isPending ? "Lagrer…" : "Lagre"}
            </Button>
          </div>
        }
      >
        {lookupsError ? (
          <p className="text-sm text-destructive">Kunne ikke laste varetyper eller måleenheter.</p>
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
                {formError}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="shop-varetype">Varetype</Label>
              <select
                id="shop-varetype"
                className={selectStyles}
                value={varetypeIdStr}
                onChange={(e) => setVaretypeIdStr(e.target.value)}
              >
                <option value="">Velg …</option>
                {(varetyperQuery.data ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.varetype}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-maaleenhet">Måleenhet</Label>
              <select
                id="shop-maaleenhet"
                className={selectStyles}
                value={maaleenhetIdStr}
                onChange={(e) => setMaaleenhetIdStr(e.target.value)}
              >
                <option value="">Ingen</option>
                {(maaleenheterQuery.data ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.enhet}
                    {m.type ? ` (${m.type})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-kvantitet">Mengde (valgfritt)</Label>
              <Input
                id="shop-kvantitet"
                inputMode="decimal"
                autoComplete="off"
                placeholder="La stå tom for påminnelse"
                value={kvantitetStr}
                onChange={(e) => setKvantitetStr(e.target.value)}
                aria-invalid={formError?.includes("Mengde") ? true : undefined}
              />
            </div>
          </div>
        )}
      </DetailSheet>

      <DetailSheet
        open={completeSheetOpen}
        onOpenChange={setCompleteSheetOpen}
        labelledById={SHOP_COMPLETE_SHEET_TITLE_ID}
        title="Fullfør handletur?"
        description="Bekreft når du er ferdig i butikken. Kjøpte rader arkiveres for kokebok senere; aktive rader blir stående."
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
              Avbryt
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
                      toast.success("Handletur fullført")
                    } else {
                      toast.info("Ingenting nytt å arkivere")
                    }
                  },
                  onError: (err) =>
                    toast.error(
                      err instanceof ApiError ? err.message : "Noe gikk galt. Prøv igjen.",
                    ),
                })
              }
            >
              {completeTrip.isPending ? "Fullfører…" : "Bekreft"}
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
          <div className="space-y-3">
            <p className="text-sm text-destructive">Kunne ikke hente oppsummering.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-2xl"
              onClick={() => void previewQuery.refetch()}
            >
              Prøv igjen
            </Button>
          </div>
        ) : previewQuery.data ? (
          <ul className="list-none space-y-3 text-sm leading-snug text-foreground">
            <li className="rounded-xl border border-border/80 bg-muted/20 px-3 py-2.5">
              <span className="font-medium text-foreground">Arkiveres</span>
              <span className="mt-0.5 block tabular-nums text-muted-foreground">
                {previewQuery.data.archiveRowCount}{" "}
                {previewQuery.data.archiveRowCount === 1 ? "rad" : "rader"}
              </span>
            </li>
            <li className="rounded-xl border border-border/80 bg-muted/20 px-3 py-2.5">
              <span className="font-medium text-foreground">Kokebok (senere)</span>
              <span className="mt-0.5 block tabular-nums text-muted-foreground">
                {previewQuery.data.cookbookMealCount}{" "}
                {previewQuery.data.cookbookMealCount === 1 ? "måltid" : "måltider"}
              </span>
            </li>
            <li className="rounded-xl border border-border/80 bg-muted/20 px-3 py-2.5">
              <span className="font-medium text-foreground">Forblir på aktiv liste</span>
              <span className="mt-0.5 block tabular-nums text-muted-foreground">
                {previewQuery.data.remainingActiveRowCount}{" "}
                {previewQuery.data.remainingActiveRowCount === 1 ? "rad" : "rader"}
              </span>
            </li>
          </ul>
        ) : null}
      </DetailSheet>
    </div>
  )
}
