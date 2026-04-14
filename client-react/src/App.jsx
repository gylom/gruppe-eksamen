import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

const api = axios.create({
  baseURL: "http://localhost:5188/api"
});

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));

  const [brukernavn, setBrukernavn] = useState("gytis");
  const [email, setEmail] = useState("gytis@test.no");
  const [passord, setPassord] = useState("Test123!");
  const [fullName, setFullName] = useState("Gytis");
  const [householdName, setHouseholdName] = useState("Gytis sitt hjem");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [products, setProducts] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [units, setUnits] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [recommendedRecipes, setRecommendedRecipes] = useState([]);

  const [household, setHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [shoppingSuggestions, setShoppingSuggestions] = useState([]);
  const [consumptionRows, setConsumptionRows] = useState([]);

  const [productSearch, setProductSearch] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState("");

  const [inventoryForm, setInventoryForm] = useState({
    productId: "",
    quantity: "1",
    measurementUnitId: "",
    purchaseDate: "",
    bestBeforeDate: "",
    placementId: ""
  });

  const [settingsForm, setSettingsForm] = useState({
    productTypeId: "",
    minimumStock: "0",
    isEmergencyStock: false
  });

  const [recipeForm, setRecipeForm] = useState({
    name: "",
    instructions: "",
    servings: 1,
    imageUrl: "",
    ingredients: [
      {
        productTypeId: "",
        quantity: "1",
        measurementUnitId: "",
        type: "ingredient",
        optional: false
      }
    ]
  });

  const [householdForm, setHouseholdForm] = useState({
    navn: ""
  });

  const [memberForm, setMemberForm] = useState({
    brukernavnEllerEmail: "",
    rolle: "medlem"
  });

  const [placementForm, setPlacementForm] = useState({
    plassering: ""
  });

  const [shoppingForm, setShoppingForm] = useState({
    varetypeId: "",
    vareId: "",
    kvantitet: "1",
    maaleenhetId: ""
  });

  const [consumptionForm, setConsumptionForm] = useState({
    varelagerId: "",
    vareId: "",
    kvantitet: "1",
    maaleenhetId: "",
    forbruksdato: ""
  });

  const authHeaders = useMemo(() => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  function showMessage(text) {
    setMessage(text);
    setError("");
  }

  function showError(text) {
    setError(text);
    setMessage("");
  }

  function saveAuth(data) {
    setToken(data.token);
    setUser(data);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data));
  }

  function logout() {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setProducts([]);
    setProductTypes([]);
    setUnits([]);
    setInventory([]);
    setRecipes([]);
    setRecommendedRecipes([]);
    setHousehold(null);
    setMembers([]);
    setPlacements([]);
    setShoppingList([]);
    setShoppingSuggestions([]);
    setConsumptionRows([]);

    showMessage("Du er logget ut.");
  }

  async function register() {
    try {
      const res = await api.post("/auth/register", {
        brukernavn,
        email,
        passord,
        fullName,
        householdName
      });
      saveAuth(res.data);
      showMessage("Bruker registrert.");
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Registrering feilet.");
    }
  }

  async function login() {
    try {
      const res = await api.post("/auth/login", {
        brukernavnEllerEmail: email.trim() || brukernavn.trim(),
        passord
      });
      saveAuth(res.data);
      showMessage("Innlogging vellykket.");
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Innlogging feilet.");
    }
  }

  async function loadUnits() {
    try {
      const res = await api.get("/maaleenheter", { headers: authHeaders });
      setUnits(res.data);
    } catch (err) {
      console.error(err);
      showError("Kunne ikke hente måleenheter.");
    }
  }

  async function loadProductTypes() {
    try {
      const res = await api.get("/varetyper", { headers: authHeaders });
      setProductTypes(res.data);
    } catch (err) {
      console.error(err);
      showError("Kunne ikke hente varetyper.");
    }
  }

  async function loadProducts() {
    try {
      const params = new URLSearchParams();
      if (productSearch.trim()) params.append("sok", productSearch.trim());
      if (productTypeFilter) params.append("varetypeId", productTypeFilter);

      const url = params.toString() ? `/varer?${params.toString()}` : "/varer";
      const res = await api.get(url, { headers: authHeaders });
      setProducts(res.data);
    } catch (err) {
      console.error(err);
      showError("Kunne ikke hente varer.");
    }
  }

  async function loadInventory() {
    try {
      const res = await api.get("/varelager", { headers: authHeaders });
      setInventory(res.data);
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Kunne ikke hente varelager.");
    }
  }

  async function addInventoryItem() {
    try {
      if (!inventoryForm.productId) {
        showError("Velg et produkt først.");
        return;
      }

      const payload = {
        vareId: Number(inventoryForm.productId),
        kvantitet: Number(inventoryForm.quantity),
        maaleenhetId: inventoryForm.measurementUnitId
            ? Number(inventoryForm.measurementUnitId)
            : null,
        kjopsdato: inventoryForm.purchaseDate
            ? `${inventoryForm.purchaseDate}T00:00:00`
            : null,
        bestfordato: inventoryForm.bestBeforeDate || null,
        plasseringId: inventoryForm.placementId
            ? Number(inventoryForm.placementId)
            : null
      };

      await api.post("/varelager", payload, {
        headers: authHeaders
      });

      setInventoryForm({
        productId: "",
        quantity: "1",
        measurementUnitId: "",
        purchaseDate: "",
        bestBeforeDate: "",
        placementId: placements[0]?.id ? String(placements[0].id) : ""
      });

      showMessage("Vare lagt til i varelager.");
      await loadInventory();
      await loadRecommendedRecipes();
      await loadConsumption();
    } catch (err) {
      console.error(err);
      showError(
          err.response?.data?.message ||
          JSON.stringify(err.response?.data) ||
          "Kunne ikke legge til vare."
      );
    }
  }

  async function takeFromInventory(itemId) {
    const quantityTaken = prompt("Hvor mye vil du ta ut fra denne varen?", "1");
    if (!quantityTaken) return;

    try {
      await api.post(
          `/varelager/${itemId}/taut`,
          { kvantitet: Number(quantityTaken) },
          { headers: authHeaders }
      );
      showMessage("Varelager oppdatert.");
      await loadInventory();
      await loadRecommendedRecipes();
      await loadConsumption();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Kunne ikke ta ut vare.");
    }
  }

  async function saveInventorySettings() {
    try {
      if (!settingsForm.productTypeId) {
        showError("Velg en varetype først.");
        return;
      }

      await api.post(
          "/varelager/innstillinger",
          {
            varetypeId: Number(settingsForm.productTypeId),
            minimumslager: Number(settingsForm.minimumStock),
            beredskapslager: settingsForm.isEmergencyStock
          },
          { headers: authHeaders }
      );
      showMessage("Minimumslager og beredskapslager lagret.");
      await loadInventory();
      await loadShoppingList();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Kunne ikke lagre innstillinger.");
    }
  }

  async function loadRecipes() {
    try {
      const res = await api.get("/oppskrifter", { headers: authHeaders });
      setRecipes(res.data);
    } catch (err) {
      console.error(err);
      showError("Kunne ikke hente oppskrifter.");
    }
  }

  async function loadRecommendedRecipes() {
    try {
      const res = await api.get("/oppskrifteranbefalt", { headers: authHeaders });
      setRecommendedRecipes(res.data);
    } catch (err) {
      console.error(err);
      showError("Kunne ikke hente anbefalte oppskrifter.");
    }
  }

  function updateIngredient(index, field, value) {
    const ingredients = [...recipeForm.ingredients];
    ingredients[index] = { ...ingredients[index], [field]: value };
    setRecipeForm({ ...recipeForm, ingredients });
  }

  function addIngredientRow() {
    setRecipeForm({
      ...recipeForm,
      ingredients: [
        ...recipeForm.ingredients,
        {
          productTypeId: "",
          quantity: "1",
          measurementUnitId: "",
          type: "ingredient",
          optional: false
        }
      ]
    });
  }

  async function createRecipe() {
    try {
      if (!recipeForm.name.trim()) {
        showError("Skriv inn navn på oppskriften.");
        return;
      }

      const payload = {
        navn: recipeForm.name,
        instruksjoner: recipeForm.instructions,
        porsjoner: Number(recipeForm.servings),
        bilde: recipeForm.imageUrl || null,
        ingredienser: recipeForm.ingredients
            .filter((ingredient) => ingredient.productTypeId)
            .map((ingredient) => ({
              varetypeId: Number(ingredient.productTypeId),
              kvantitet: Number(ingredient.quantity),
              maaleenhetId: ingredient.measurementUnitId
                  ? Number(ingredient.measurementUnitId)
                  : null,
              type: ingredient.type || "ingredient",
              valgfritt: ingredient.optional
            }))
      };

      await api.post("/oppskrifter", payload, { headers: authHeaders });

      setRecipeForm({
        name: "",
        instructions: "",
        servings: 1,
        imageUrl: "",
        ingredients: [
          {
            productTypeId: "",
            quantity: "1",
            measurementUnitId: "",
            type: "ingredient",
            optional: false
          }
        ]
      });

      showMessage("Oppskrift opprettet.");
      await loadRecipes();
      await loadRecommendedRecipes();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Kunne ikke opprette oppskrift.");
    }
  }

  async function loadHousehold() {
    try {
      const res = await api.get("/husholdning", { headers: authHeaders });
      setHousehold(res.data.household || null);
      setMembers(res.data.medlemmer || []);
      setPlacements(res.data.plasseringer || []);

      setHouseholdForm({
        navn: res.data.household?.navn || ""
      });

      setInventoryForm((prev) => ({
        ...prev,
        placementId: res.data.plasseringer?.[0]?.id ? String(res.data.plasseringer[0].id) : prev.placementId
      }));
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Kunne ikke hente husholdning.");
    }
  }

  async function createHousehold() {
    try {
      if (!householdForm.navn.trim()) {
        showError("Skriv inn navn på husholdningen.");
        return;
      }

      await api.post(
          "/husholdning",
          { navn: householdForm.navn },
          { headers: authHeaders }
      );

      showMessage("Husholdning opprettet.");
      await loadHousehold();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Kunne ikke opprette husholdning.");
    }
  }

  async function renameHousehold() {
    try {
      if (!householdForm.navn.trim()) {
        showError("Skriv inn navn på husholdningen.");
        return;
      }

      await api.put(
          "/husholdning",
          { navn: householdForm.navn },
          { headers: authHeaders }
      );

      showMessage("Husholdning oppdatert.");
      await loadHousehold();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Kunne ikke oppdatere husholdning.");
    }
  }

  async function loadMembers() {
    try {
      const res = await api.get("/husholdning/medlemmer", { headers: authHeaders });
      setMembers(res.data || []);
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Kunne ikke hente medlemmer.");
    }
  }

  async function addMember() {
    try {
      if (!memberForm.brukernavnEllerEmail.trim()) {
        showError("Skriv inn brukernavn eller e-post.");
        return;
      }

      await api.post(
          "/husholdning/medlemmer",
          {
            brukernavnEllerEmail: memberForm.brukernavnEllerEmail,
            rolle: memberForm.rolle
          },
          { headers: authHeaders }
      );

      setMemberForm({
        brukernavnEllerEmail: "",
        rolle: "medlem"
      });

      showMessage("Medlem lagt til.");
      await loadMembers();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Kunne ikke legge til medlem.");
    }
  }

  async function removeMember(memberUserId) {
    if (!window.confirm("Fjerne medlemmet?")) return;

    try {
      await api.delete(`/husholdning/medlemmer/${memberUserId}`, {
        headers: authHeaders
      });

      showMessage("Medlem fjernet.");
      await loadMembers();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Kunne ikke fjerne medlem.");
    }
  }

  async function loadPlacements() {
    try {
      const res = await api.get("/husholdning/plassering", { headers: authHeaders });
      setPlacements(res.data || []);
      setInventoryForm((prev) => ({
        ...prev,
        placementId: res.data?.[0]?.id ? String(res.data[0].id) : prev.placementId
      }));
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Kunne ikke hente plasseringer.");
    }
  }

  async function addPlacement() {
    try {
      if (!placementForm.plassering.trim()) {
        showError("Skriv inn plassering.");
        return;
      }

      await api.post(
          "/husholdning/plassering",
          { plassering: placementForm.plassering },
          { headers: authHeaders }
      );

      setPlacementForm({ plassering: "" });
      showMessage("Plassering opprettet.");
      await loadPlacements();
      await loadHousehold();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Kunne ikke opprette plassering.");
    }
  }

  async function deletePlacement(id) {
    if (!window.confirm("Slette plassering?")) return;

    try {
      await api.delete(`/husholdning/plassering/${id}`, {
        headers: authHeaders
      });

      showMessage("Plassering slettet.");
      await loadPlacements();
      await loadHousehold();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Kunne ikke slette plassering.");
    }
  }

  async function loadShoppingList() {
    try {
      const res = await api.get("/handleliste", { headers: authHeaders });
      setShoppingList(res.data.varer || []);
      setShoppingSuggestions(res.data.forslag || []);
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Kunne ikke hente handleliste.");
    }
  }

  async function addShoppingItem() {
    try {
      if (!shoppingForm.varetypeId) {
        showError("Velg en varetype.");
        return;
      }

      await api.post(
          "/handleliste",
          {
            varetypeId: Number(shoppingForm.varetypeId),
            vareId: shoppingForm.vareId ? Number(shoppingForm.vareId) : null,
            kvantitet: shoppingForm.kvantitet ? Number(shoppingForm.kvantitet) : null,
            maaleenhetId: shoppingForm.maaleenhetId ? Number(shoppingForm.maaleenhetId) : null
          },
          { headers: authHeaders }
      );

      setShoppingForm({
        varetypeId: "",
        vareId: "",
        kvantitet: "1",
        maaleenhetId: ""
      });

      showMessage("Vare lagt til i handleliste.");
      await loadShoppingList();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Kunne ikke legge til i handleliste.");
    }
  }

  async function deleteShoppingItem(id) {
    if (!window.confirm("Slette handleliste-rad?")) return;

    try {
      await api.delete(`/handleliste/${id}`, {
        headers: authHeaders
      });

      showMessage("Handleliste-rad slettet.");
      await loadShoppingList();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Kunne ikke slette handleliste-rad.");
    }
  }

  async function addSuggestionToShoppingList(suggestion) {
    try {
      await api.post(
          "/handleliste",
          {
            varetypeId: Number(suggestion.varetypeId),
            kvantitet: Number(suggestion.forslagKvantitet)
          },
          { headers: authHeaders }
      );

      showMessage("Forslag lagt til i handleliste.");
      await loadShoppingList();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Kunne ikke legge til forslag.");
    }
  }

  async function loadConsumption() {
    try {
      const res = await api.get("/forbruk", { headers: authHeaders });
      setConsumptionRows(res.data || []);
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Kunne ikke hente forbruk.");
    }
  }

  async function createConsumption() {
    try {
      if (!consumptionForm.kvantitet || Number(consumptionForm.kvantitet) <= 0) {
        showError("Kvantitet må være større enn 0.");
        return;
      }

      const payload = {
        varelagerId: consumptionForm.varelagerId ? Number(consumptionForm.varelagerId) : null,
        vareId: consumptionForm.vareId ? Number(consumptionForm.vareId) : null,
        kvantitet: Number(consumptionForm.kvantitet),
        maaleenhetId: consumptionForm.maaleenhetId ? Number(consumptionForm.maaleenhetId) : null,
        forbruksdato: consumptionForm.forbruksdato
            ? `${consumptionForm.forbruksdato}T00:00:00`
            : null
      };

      await api.post("/forbruk", payload, { headers: authHeaders });

      setConsumptionForm({
        varelagerId: "",
        vareId: "",
        kvantitet: "1",
        maaleenhetId: "",
        forbruksdato: ""
      });

      showMessage("Forbruk registrert.");
      await loadConsumption();
      await loadInventory();
      await loadRecommendedRecipes();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Kunne ikke registrere forbruk.");
    }
  }

  useEffect(() => {
    if (!token) return;
    loadUnits();
    loadProductTypes();
    loadProducts();
    loadInventory();
    loadRecipes();
    loadRecommendedRecipes();
    loadHousehold();
    loadMembers();
    loadPlacements();
    loadShoppingList();
    loadConsumption();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadProducts();
  }, [productSearch, productTypeFilter]);

  useEffect(() => {
    if (!message && !error) return;
    const timer = setTimeout(() => {
      setMessage("");
      setError("");
    }, 3000);
    return () => clearTimeout(timer);
  }, [message, error]);

  return (
      <div className="page">
        <header className="header">
          <div>
            <h1>Matlager / Beredskapslager</h1>
            <p>React-klient oppdatert for SQL-schema backend.</p>
          </div>
          {token && (
              <div className="userbox">
                <strong>{user?.fullName || user?.brukernavn || user?.email}</strong>
                <span>{user?.email}</span>
                <button onClick={logout}>Logg ut</button>
              </div>
          )}
        </header>

        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        {!token ? (
            <section className="card">
              <h2>Innlogging / registrering</h2>
              <div className="grid two">
                <label>
                  Brukernavn
                  <input value={brukernavn} onChange={(e) => setBrukernavn(e.target.value)} />
                </label>
                <label>
                  E-post
                  <input value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                <label>
                  Passord
                  <input type="password" value={passord} onChange={(e) => setPassord(e.target.value)} />
                </label>
                <label>
                  Fullt navn
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </label>
                <label>
                  Husholdning
                  <input value={householdName} onChange={(e) => setHouseholdName(e.target.value)} />
                </label>
              </div>
              <div className="actions">
                <button onClick={register}>Registrer</button>
                <button onClick={login}>Logg inn</button>
              </div>
            </section>
        ) : (
            <>
              <section className="card">
                <h2>1. Husholdning</h2>
                <div className="grid two">
                  <label>
                    Husholdningsnavn
                    <input
                        value={householdForm.navn}
                        onChange={(e) => setHouseholdForm({ navn: e.target.value })}
                    />
                  </label>
                  <div className="actions align-end">
                    <button onClick={createHousehold}>Opprett husholdning</button>
                    <button onClick={renameHousehold}>Oppdater navn</button>
                  </div>
                </div>

                <div className="mini-card">
                  <p><strong>Aktiv husholdning:</strong> {household?.navn || "-"}</p>
                  <p><strong>Min rolle:</strong> {household?.minRolle || "-"}</p>
                </div>
              </section>

              <section className="card">
                <h2>2. Medlemmer</h2>
                <div className="grid three">
                  <label>
                    Brukernavn eller e-post
                    <input
                        value={memberForm.brukernavnEllerEmail}
                        onChange={(e) => setMemberForm({ ...memberForm, brukernavnEllerEmail: e.target.value })}
                    />
                  </label>
                  <label>
                    Rolle
                    <select
                        value={memberForm.rolle}
                        onChange={(e) => setMemberForm({ ...memberForm, rolle: e.target.value })}
                    >
                      <option value="medlem">medlem</option>
                      <option value="eier">eier</option>
                    </select>
                  </label>
                  <div className="actions align-end">
                    <button onClick={addMember}>Legg til medlem</button>
                    <button onClick={loadMembers}>Oppdater medlemmer</button>
                  </div>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                    <tr>
                      <th>Brukernavn</th>
                      <th>E-post</th>
                      <th>Rolle</th>
                      <th>Fjern</th>
                    </tr>
                    </thead>
                    <tbody>
                    {members.map((member) => (
                        <tr key={member.userId}>
                          <td>{member.brukernavn}</td>
                          <td>{member.email}</td>
                          <td>{member.rolle}</td>
                          <td>
                            {!member.erMeg && (
                                <button onClick={() => removeMember(member.userId)}>Fjern</button>
                            )}
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="card">
                <h2>3. Plasseringer</h2>
                <div className="grid two">
                  <label>
                    Ny plassering
                    <input
                        value={placementForm.plassering}
                        onChange={(e) => setPlacementForm({ plassering: e.target.value })}
                        placeholder="Kjøleskap, fryser, bod..."
                    />
                  </label>
                  <div className="actions align-end">
                    <button onClick={addPlacement}>Legg til plassering</button>
                    <button onClick={loadPlacements}>Oppdater plasseringer</button>
                  </div>
                </div>

                <div className="cards-grid">
                  {placements.map((placement) => (
                      <article className="mini-card" key={placement.id}>
                        <h3>{placement.plassering}</h3>
                        <p>ID: {placement.id}</p>
                        <button onClick={() => deletePlacement(placement.id)}>Slett</button>
                      </article>
                  ))}
                </div>
              </section>

              <section className="card">
                <h2>4. Filterbare varer</h2>
                <div className="grid three">
                  <label>
                    Søk
                    <input
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="melk, pasta, ean..."
                    />
                  </label>
                  <label>
                    Varetype
                    <select
                        value={productTypeFilter}
                        onChange={(e) => setProductTypeFilter(e.target.value)}
                    >
                      <option value="">Alle</option>
                      {productTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.varetype}
                          </option>
                      ))}
                    </select>
                  </label>
                  <div className="actions align-end">
                    <button onClick={loadProducts}>Oppdater varer</button>
                  </div>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                    <tr>
                      <th>Id</th>
                      <th>Navn</th>
                      <th>Merke</th>
                      <th>Varetype</th>
                      <th>Kategori</th>
                      <th>Pakning</th>
                      <th>EAN</th>
                    </tr>
                    </thead>
                    <tbody>
                    {products.map((product) => (
                        <tr key={product.id}>
                          <td>{product.id}</td>
                          <td>{product.varenavn}</td>
                          <td>{product.merke || "-"}</td>
                          <td>{product.varetype}</td>
                          <td>{product.kategori || "-"}</td>
                          <td>{product.kvantitet ? `${product.kvantitet} ${product.maaleenhet || ""}` : "-"}</td>
                          <td>{product.ean || "-"}</td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="card">
                <h2>5. Legg til vare i varelager</h2>
                <div className="grid three">
                  <label>
                    Produkt
                    <select
                        value={inventoryForm.productId}
                        onChange={(e) => setInventoryForm({ ...inventoryForm, productId: e.target.value })}
                    >
                      <option value="">Velg produkt</option>
                      {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.varenavn} ({product.id})
                          </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Mengde
                    <input
                        value={inventoryForm.quantity}
                        onChange={(e) => setInventoryForm({ ...inventoryForm, quantity: e.target.value })}
                    />
                  </label>

                  <label>
                    Måleenhet
                    <select
                        value={inventoryForm.measurementUnitId}
                        onChange={(e) => setInventoryForm({ ...inventoryForm, measurementUnitId: e.target.value })}
                    >
                      <option value="">Bruk valgt / standard</option>
                      {units.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.enhet}
                          </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Kjøpsdato
                    <input
                        type="date"
                        value={inventoryForm.purchaseDate}
                        onChange={(e) => setInventoryForm({ ...inventoryForm, purchaseDate: e.target.value })}
                    />
                  </label>

                  <label>
                    Best før
                    <input
                        type="date"
                        value={inventoryForm.bestBeforeDate}
                        onChange={(e) => setInventoryForm({ ...inventoryForm, bestBeforeDate: e.target.value })}
                    />
                  </label>

                  <label>
                    Plassering
                    <select
                        value={inventoryForm.placementId}
                        onChange={(e) => setInventoryForm({ ...inventoryForm, placementId: e.target.value })}
                    >
                      <option value="">Velg plassering</option>
                      {placements.map((placement) => (
                          <option key={placement.id} value={placement.id}>
                            {placement.plassering}
                          </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="actions">
                  <button onClick={addInventoryItem}>Legg til i lager</button>
                  <button onClick={loadInventory}>Oppdater varelager</button>
                </div>
              </section>

              <section className="card">
                <h2>6. Minimumslager og beredskapslager</h2>
                <div className="grid three">
                  <label>
                    Varetype
                    <select
                        value={settingsForm.productTypeId}
                        onChange={(e) => setSettingsForm({ ...settingsForm, productTypeId: e.target.value })}
                    >
                      <option value="">Velg varetype</option>
                      {productTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.varetype}
                          </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Minimumslager
                    <input
                        value={settingsForm.minimumStock}
                        onChange={(e) => setSettingsForm({ ...settingsForm, minimumStock: e.target.value })}
                    />
                  </label>

                  <label className="checkbox-row">
                    <span>Del av beredskapslager</span>
                    <input
                        type="checkbox"
                        checked={settingsForm.isEmergencyStock}
                        onChange={(e) => setSettingsForm({ ...settingsForm, isEmergencyStock: e.target.checked })}
                    />
                  </label>
                </div>
                <div className="actions">
                  <button onClick={saveInventorySettings}>Lagre innstillinger</button>
                </div>
              </section>

              <section className="card">
                <h2>7. Varelageroversikt</h2>
                <div className="table-wrap">
                  <table>
                    <thead>
                    <tr>
                      <th>Navn</th>
                      <th>Varetype</th>
                      <th>Total mengde</th>
                      <th>Minimum</th>
                      <th>Beredskap</th>
                      <th>Plasseringer</th>
                      <th>Ta ut</th>
                    </tr>
                    </thead>
                    <tbody>
                    {inventory.map((row, index) => (
                        <tr key={`${row.varetype_id}-${index}`}>
                          <td>{row.varenavn}</td>
                          <td>{row.varetype}</td>
                          <td>{row.total_kvantitet} {row.maaleenhet || ""}</td>
                          <td>{row.minimumslager ?? 0}</td>
                          <td>{row.beredskapslager ? "Ja" : "Nei"}</td>
                          <td>{row.plasseringer?.length ? row.plasseringer.join(", ") : "-"}</td>
                          <td>
                            {row.varer?.length > 0 ? (
                                <div className="stack">
                                  {row.varer.map((item) => (
                                      <button key={item.id} onClick={() => takeFromInventory(item.id)}>
                                        Ta ut fra id {item.id}
                                      </button>
                                  ))}
                                </div>
                            ) : (
                                <span>-</span>
                            )}
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="card">
                <h2>8. Handleliste</h2>
                <div className="grid four">
                  <label>
                    Varetype
                    <select
                        value={shoppingForm.varetypeId}
                        onChange={(e) => setShoppingForm({ ...shoppingForm, varetypeId: e.target.value })}
                    >
                      <option value="">Velg varetype</option>
                      {productTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.varetype}
                          </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Vare
                    <select
                        value={shoppingForm.vareId}
                        onChange={(e) => setShoppingForm({ ...shoppingForm, vareId: e.target.value })}
                    >
                      <option value="">Valgfri konkret vare</option>
                      {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.varenavn}
                          </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Mengde
                    <input
                        value={shoppingForm.kvantitet}
                        onChange={(e) => setShoppingForm({ ...shoppingForm, kvantitet: e.target.value })}
                    />
                  </label>

                  <label>
                    Måleenhet
                    <select
                        value={shoppingForm.maaleenhetId}
                        onChange={(e) => setShoppingForm({ ...shoppingForm, maaleenhetId: e.target.value })}
                    >
                      <option value="">Ingen</option>
                      {units.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.enhet}
                          </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="actions">
                  <button onClick={addShoppingItem}>Legg til i handleliste</button>
                  <button onClick={loadShoppingList}>Oppdater handleliste</button>
                </div>

                <h3>Handleliste</h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                    <tr>
                      <th>Varetype</th>
                      <th>Vare</th>
                      <th>Mengde</th>
                      <th>Måleenhet</th>
                      <th>Bruker</th>
                      <th>Slett</th>
                    </tr>
                    </thead>
                    <tbody>
                    {shoppingList.map((item) => (
                        <tr key={item.id}>
                          <td>{item.varetype}</td>
                          <td>{item.varenavn || "-"}</td>
                          <td>{item.kvantitet ?? "-"}</td>
                          <td>{item.maaleenhet || "-"}</td>
                          <td>{item.brukernavn}</td>
                          <td>
                            <button onClick={() => deleteShoppingItem(item.id)}>Slett</button>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>

                <h3>Forslag fra minimumslager</h3>
                <div className="cards-grid">
                  {shoppingSuggestions.map((item, index) => (
                      <article className="mini-card" key={`${item.varetypeId}-${index}`}>
                        <h3>{item.varetype}</h3>
                        <p>Forslag mengde: {item.forslagKvantitet}</p>
                        <p>{item.begrunnelse}</p>
                        <button onClick={() => addSuggestionToShoppingList(item)}>Legg til forslag</button>
                      </article>
                  ))}
                </div>
              </section>

              <section className="card">
                <h2>9. Forbruk</h2>
                <div className="grid four">
                  <label>
                    Fra varelager-rad
                    <select
                        value={consumptionForm.varelagerId}
                        onChange={(e) => setConsumptionForm({ ...consumptionForm, varelagerId: e.target.value })}
                    >
                      <option value="">Velg varelager-rad</option>
                      {inventory.flatMap((row) =>
                          (row.varer || []).map((item) => (
                              <option key={item.id} value={item.id}>
                                {row.varenavn} (lager-id {item.id})
                              </option>
                          ))
                      )}
                    </select>
                  </label>

                  <label>
                    Eller vare
                    <select
                        value={consumptionForm.vareId}
                        onChange={(e) => setConsumptionForm({ ...consumptionForm, vareId: e.target.value })}
                    >
                      <option value="">Velg vare</option>
                      {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.varenavn}
                          </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Mengde
                    <input
                        value={consumptionForm.kvantitet}
                        onChange={(e) => setConsumptionForm({ ...consumptionForm, kvantitet: e.target.value })}
                    />
                  </label>

                  <label>
                    Måleenhet
                    <select
                        value={consumptionForm.maaleenhetId}
                        onChange={(e) => setConsumptionForm({ ...consumptionForm, maaleenhetId: e.target.value })}
                    >
                      <option value="">Ingen</option>
                      {units.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.enhet}
                          </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Forbruksdato
                    <input
                        type="date"
                        value={consumptionForm.forbruksdato}
                        onChange={(e) => setConsumptionForm({ ...consumptionForm, forbruksdato: e.target.value })}
                    />
                  </label>
                </div>

                <div className="actions">
                  <button onClick={createConsumption}>Registrer forbruk</button>
                  <button onClick={loadConsumption}>Oppdater forbruk</button>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                    <tr>
                      <th>Dato</th>
                      <th>Vare</th>
                      <th>Varetype</th>
                      <th>Mengde</th>
                      <th>Måleenhet</th>
                      <th>Bruker</th>
                    </tr>
                    </thead>
                    <tbody>
                    {consumptionRows.map((row) => (
                        <tr key={row.id}>
                          <td>{row.forbruksdato ? new Date(row.forbruksdato).toLocaleDateString() : "-"}</td>
                          <td>{row.varenavn}</td>
                          <td>{row.varetype}</td>
                          <td>{row.kvantitet ?? "-"}</td>
                          <td>{row.maaleenhet || "-"}</td>
                          <td>{row.brukernavn}</td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="card">
                <h2>10. Oppskrifter</h2>
                <div className="grid two">
                  <label>
                    Navn
                    <input
                        value={recipeForm.name}
                        onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })}
                    />
                  </label>
                  <label>
                    Porsjoner
                    <input
                        value={recipeForm.servings}
                        onChange={(e) => setRecipeForm({ ...recipeForm, servings: e.target.value })}
                    />
                  </label>
                </div>

                <label>
                  Bilde-URL
                  <input
                      value={recipeForm.imageUrl}
                      onChange={(e) => setRecipeForm({ ...recipeForm, imageUrl: e.target.value })}
                  />
                </label>

                <label>
                  Instruksjoner
                  <textarea
                      rows="5"
                      value={recipeForm.instructions}
                      onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })}
                  />
                </label>

                <h3>Ingredienser</h3>
                {recipeForm.ingredients.map((ingredient, index) => (
                    <div className="grid four ingredient-row" key={index}>
                      <label>
                        Varetype
                        <select
                            value={ingredient.productTypeId}
                            onChange={(e) => updateIngredient(index, "productTypeId", e.target.value)}
                        >
                          <option value="">Velg varetype</option>
                          {productTypes.map((type) => (
                              <option key={type.id} value={type.id}>
                                {type.varetype}
                              </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Mengde
                        <input
                            value={ingredient.quantity}
                            onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                        />
                      </label>

                      <label>
                        Måleenhet
                        <select
                            value={ingredient.measurementUnitId}
                            onChange={(e) => updateIngredient(index, "measurementUnitId", e.target.value)}
                        >
                          <option value="">Ingen</option>
                          {units.map((unit) => (
                              <option key={unit.id} value={unit.id}>
                                {unit.enhet}
                              </option>
                          ))}
                        </select>
                      </label>

                      <label className="checkbox-row">
                        <span>Valgfri</span>
                        <input
                            type="checkbox"
                            checked={ingredient.optional}
                            onChange={(e) => updateIngredient(index, "optional", e.target.checked)}
                        />
                      </label>
                    </div>
                ))}

                <div className="actions">
                  <button onClick={addIngredientRow}>Ny ingrediensrad</button>
                  <button onClick={createRecipe}>Lagre oppskrift</button>
                  <button onClick={loadRecipes}>Oppdater oppskrifter</button>
                </div>

                <div className="cards-grid">
                  {recipes.map((recipe) => (
                      <article className="mini-card" key={recipe.id}>
                        <h3>{recipe.navn}</h3>
                        <p>{recipe.porsjoner} porsjoner</p>
                        <ul>
                          {recipe.ingredienser?.map((ingredient) => (
                              <li key={ingredient.id}>
                                {ingredient.varetype} - {ingredient.kvantitet ?? 0} {ingredient.maaleenhet || ""}
                              </li>
                          ))}
                        </ul>
                      </article>
                  ))}
                </div>
              </section>

              <section className="card">
                <h2>11. Anbefalte oppskrifter</h2>
                <div className="cards-grid">
                  {recommendedRecipes.map((recipe) => (
                      <article className="mini-card" key={recipe.id}>
                        <h3>{recipe.navn}</h3>
                        <p>Match: {recipe.matchProsent}%</p>
                        <p>Har {recipe.antallDuHar} av {recipe.antallIngredienser} ingredienser</p>
                        <p>Mangler {recipe.antallDuMangler}</p>
                        {recipe.manglendeIngredienser?.length > 0 && (
                            <ul>
                              {recipe.manglendeIngredienser.map((ingredient, index) => (
                                  <li key={`${recipe.id}-${index}`}>{ingredient.varetype}</li>
                              ))}
                            </ul>
                        )}
                      </article>
                  ))}
                </div>
              </section>
            </>
        )}
      </div>
  );
}