import { useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5188/api"
});

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));

  const [email, setEmail] = useState("test@test.no");
  const [password, setPassword] = useState("Password123!");
  const [fullName, setFullName] = useState("Test User");
  const [householdName, setHouseholdName] = useState("Min Husholdning");

  const [inventory, setInventory] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [recipes, setRecipes] = useState([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [inventoryForm, setInventoryForm] = useState({
    productId: "",
    quantity: "",
    measurementUnitId: "",
    expiryDate: ""
  });

  const [shoppingForm, setShoppingForm] = useState({
    productTypeId: "",
    quantity: "",
    measurementUnitId: "",
    note: ""
  });

  const [recipeForm, setRecipeForm] = useState({
    name: "",
    instructions: "",
    servings: 1,
    imageUrl: "",
    ingredients: [
      { productTypeId: "", quantity: "", measurementUnitId: "", type: "ingredient", optional: false }
    ]
  });

  const authHeaders = token
      ? { Authorization: `Bearer ${token}` }
      : {};

  function showMessage(text) {
    setMessage(text);
    setError("");
  }

  function showError(text) {
    setError(text);
    setMessage("");
  }

  async function register() {
    try {
      setMessage("");
      setError("");

      const res = await api.post("/auth/register", {
        email,
        password,
        fullName,
        householdName
      });

      saveAuth(res.data);
      showMessage("✅ User registered successfully!");
    } catch (err) {
      console.error(err);
      showError(
          err.response?.data?.message ||
          err.response?.data?.title ||
          "❌ Registration failed"
      );
    }
  }

  async function login() {
    try {
      setMessage("");
      setError("");

      const res = await api.post("/auth/login", {
        email,
        password
      });

      saveAuth(res.data);
      showMessage("✅ Login successful!");
    } catch (err) {
      console.error(err);
      showError(
          err.response?.data?.message ||
          err.response?.data?.title ||
          "❌ Invalid email or password"
      );
    }
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
    setInventory([]);
    setShoppingList([]);
    setRecipes([]);
    showMessage("✅ Logged out");
  }

  async function loadInventory() {
    try {
      const res = await api.get("/varelager", { headers: authHeaders });
      setInventory(res.data);
    } catch (err) {
      console.error(err);
      showError("❌ Failed to load inventory");
    }
  }

  async function addInventory() {
    try {
      await api.post("/varelager", {
        productId: Number(inventoryForm.productId),
        quantity: Number(inventoryForm.quantity),
        measurementUnitId: inventoryForm.measurementUnitId ? Number(inventoryForm.measurementUnitId) : null,
        expiryDate: inventoryForm.expiryDate || null
      }, { headers: authHeaders });

      setInventoryForm({
        productId: "",
        quantity: "",
        measurementUnitId: "",
        expiryDate: ""
      });

      showMessage("✅ Inventory item added");
      loadInventory();
    } catch (err) {
      console.error(err);
      showError(
          err.response?.data?.message ||
          err.response?.data?.title ||
          "❌ Failed to add inventory item"
      );
    }
  }

  async function loadShoppingList() {
    try {
      const res = await api.get("/handleliste", { headers: authHeaders });
      setShoppingList(res.data);
    } catch (err) {
      console.error(err);
      showError("❌ Failed to load shopping list");
    }
  }

  async function addShoppingItem() {
    try {
      await api.post("/handleliste", {
        productTypeId: Number(shoppingForm.productTypeId),
        quantity: Number(shoppingForm.quantity),
        measurementUnitId: shoppingForm.measurementUnitId ? Number(shoppingForm.measurementUnitId) : null,
        note: shoppingForm.note
      }, { headers: authHeaders });

      setShoppingForm({
        productTypeId: "",
        quantity: "",
        measurementUnitId: "",
        note: ""
      });

      showMessage("✅ Shopping list item added");
      loadShoppingList();
    } catch (err) {
      console.error(err);
      showError(
          err.response?.data?.message ||
          err.response?.data?.title ||
          "❌ Failed to add shopping list item"
      );
    }
  }

  async function toggleShoppingItem(item) {
    try {
      await api.put(`/handleliste/${item.id}`, {
        quantity: item.quantity,
        measurementUnitId: null,
        completed: !item.completed,
        note: item.note
      }, { headers: authHeaders });

      showMessage("✅ Shopping list item updated");
      loadShoppingList();
    } catch (err) {
      console.error(err);
      showError("❌ Failed to update shopping list item");
    }
  }

  async function loadRecipes() {
    try {
      const res = await api.get("/oppskrifter", { headers: authHeaders });
      setRecipes(res.data);
    } catch (err) {
      console.error(err);
      showError("❌ Failed to load recipes");
    }
  }

  function updateIngredient(index, field, value) {
    const copy = [...recipeForm.ingredients];
    copy[index] = { ...copy[index], [field]: value };
    setRecipeForm({ ...recipeForm, ingredients: copy });
  }

  function addIngredientRow() {
    setRecipeForm({
      ...recipeForm,
      ingredients: [
        ...recipeForm.ingredients,
        { productTypeId: "", quantity: "", measurementUnitId: "", type: "ingredient", optional: false }
      ]
    });
  }

  async function createRecipe() {
    try {
      await api.post("/oppskrifter", {
        name: recipeForm.name,
        instructions: recipeForm.instructions,
        servings: Number(recipeForm.servings),
        imageUrl: recipeForm.imageUrl,
        ingredients: recipeForm.ingredients.map(x => ({
          productTypeId: Number(x.productTypeId),
          quantity: Number(x.quantity),
          measurementUnitId: x.measurementUnitId ? Number(x.measurementUnitId) : null,
          type: x.type,
          optional: x.optional
        }))
      }, { headers: authHeaders });

      setRecipeForm({
        name: "",
        instructions: "",
        servings: 1,
        imageUrl: "",
        ingredients: [
          { productTypeId: "", quantity: "", measurementUnitId: "", type: "ingredient", optional: false }
        ]
      });

      showMessage("✅ Recipe created");
      loadRecipes();
    } catch (err) {
      console.error(err);
      showError(
          err.response?.data?.message ||
          err.response?.data?.title ||
          "❌ Failed to create recipe"
      );
    }
  }

  async function hideRecipe(id) {
    try {
      await api.post(`/oppskrifter/${id}/skjul`, {}, { headers: authHeaders });
      showMessage("✅ Recipe hidden");
      loadRecipes();
    } catch (err) {
      console.error(err);
      showError("❌ Failed to hide recipe");
    }
  }

  useEffect(() => {
    if (token) {
      loadInventory();
      loadShoppingList();
      loadRecipes();
    }
  }, [token]);

  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage("");
        setError("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message, error]);

  return (
      <div className="container">
        <h1>Matlager App</h1>

        {message && (
            <div
                className="card"
                style={{
                  background: "#ecfdf3",
                  border: "1px solid #86efac",
                  color: "#166534"
                }}
            >
              {message}
            </div>
        )}

        {error && (
            <div
                className="card"
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fca5a5",
                  color: "#991b1b"
                }}
            >
              {error}
            </div>
        )}

        {!token ? (
            <div className="card">
              <h2>Login / Register</h2>

              <div className="row">
                <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email"
                />
                <input
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    type="password"
                />
                <input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Full name"
                />
                <input
                    value={householdName}
                    onChange={e => setHouseholdName(e.target.value)}
                    placeholder="Household name"
                />
              </div>

              <div className="row" style={{ marginTop: 12 }}>
                <button onClick={register}>Register</button>
                <button onClick={login}>Login</button>
              </div>
            </div>
        ) : (
            <>
              <div className="card">
                <strong>Logged in:</strong> {user?.fullName} ({user?.email})
                <div style={{ marginTop: 10 }}>
                  <button onClick={logout}>Logout</button>
                </div>
              </div>

              <div className="card">
                <h2>Varelager</h2>
                <div className="row">
                  <input
                      placeholder="ProductId"
                      value={inventoryForm.productId}
                      onChange={e => setInventoryForm({ ...inventoryForm, productId: e.target.value })}
                  />
                  <input
                      placeholder="Quantity"
                      value={inventoryForm.quantity}
                      onChange={e => setInventoryForm({ ...inventoryForm, quantity: e.target.value })}
                  />
                  <input
                      placeholder="MeasurementUnitId"
                      value={inventoryForm.measurementUnitId}
                      onChange={e => setInventoryForm({ ...inventoryForm, measurementUnitId: e.target.value })}
                  />
                  <input
                      type="date"
                      value={inventoryForm.expiryDate}
                      onChange={e => setInventoryForm({ ...inventoryForm, expiryDate: e.target.value })}
                  />
                  <button onClick={addInventory}>Add</button>
                  <button onClick={loadInventory}>Refresh</button>
                </div>

                <ul>
                  {inventory.map(item => (
                      <li key={item.id}>
                        {item.productName} - {item.quantity} {item.unit || ""} - utløper:{" "}
                        {item.expiryDate ? item.expiryDate.substring(0, 10) : "ikke satt"}
                      </li>
                  ))}
                </ul>
              </div>

              <div className="card">
                <h2>Handleliste</h2>
                <div className="row">
                  <input
                      placeholder="ProductTypeId"
                      value={shoppingForm.productTypeId}
                      onChange={e => setShoppingForm({ ...shoppingForm, productTypeId: e.target.value })}
                  />
                  <input
                      placeholder="Quantity"
                      value={shoppingForm.quantity}
                      onChange={e => setShoppingForm({ ...shoppingForm, quantity: e.target.value })}
                  />
                  <input
                      placeholder="MeasurementUnitId"
                      value={shoppingForm.measurementUnitId}
                      onChange={e => setShoppingForm({ ...shoppingForm, measurementUnitId: e.target.value })}
                  />
                  <input
                      placeholder="Note"
                      value={shoppingForm.note}
                      onChange={e => setShoppingForm({ ...shoppingForm, note: e.target.value })}
                  />
                  <button onClick={addShoppingItem}>Add</button>
                  <button onClick={loadShoppingList}>Refresh</button>
                </div>

                <ul>
                  {shoppingList.map(item => (
                      <li key={item.id}>
                        {item.productTypeName} - {item.quantity} {item.unit || ""} -{" "}
                        {item.completed ? "ferdig" : "ikke ferdig"}
                        <button style={{ marginLeft: 8 }} onClick={() => toggleShoppingItem(item)}>
                          Toggle done
                        </button>
                      </li>
                  ))}
                </ul>
              </div>

              <div className="card">
                <h2>Oppskrifter</h2>
                <div className="row">
                  <input
                      placeholder="Name"
                      value={recipeForm.name}
                      onChange={e => setRecipeForm({ ...recipeForm, name: e.target.value })}
                  />
                  <input
                      placeholder="Servings"
                      value={recipeForm.servings}
                      onChange={e => setRecipeForm({ ...recipeForm, servings: e.target.value })}
                  />
                  <input
                      placeholder="Image URL"
                      value={recipeForm.imageUrl}
                      onChange={e => setRecipeForm({ ...recipeForm, imageUrl: e.target.value })}
                  />
                </div>

                <div style={{ marginTop: 12 }}>
              <textarea
                  rows="4"
                  style={{ width: "100%" }}
                  placeholder="Instructions"
                  value={recipeForm.instructions}
                  onChange={e => setRecipeForm({ ...recipeForm, instructions: e.target.value })}
              />
                </div>

                <h4>Ingredients</h4>
                {recipeForm.ingredients.map((ing, index) => (
                    <div className="row" key={index} style={{ marginBottom: 8 }}>
                      <input
                          placeholder="ProductTypeId"
                          value={ing.productTypeId}
                          onChange={e => updateIngredient(index, "productTypeId", e.target.value)}
                      />
                      <input
                          placeholder="Quantity"
                          value={ing.quantity}
                          onChange={e => updateIngredient(index, "quantity", e.target.value)}
                      />
                      <input
                          placeholder="MeasurementUnitId"
                          value={ing.measurementUnitId}
                          onChange={e => updateIngredient(index, "measurementUnitId", e.target.value)}
                      />
                    </div>
                ))}

                <div className="row">
                  <button onClick={addIngredientRow}>Add ingredient row</button>
                  <button onClick={createRecipe}>Create recipe</button>
                  <button onClick={loadRecipes}>Refresh</button>
                </div>

                <ul>
                  {recipes.map(recipe => (
                      <li key={recipe.id}>
                        <strong>{recipe.name}</strong> ({recipe.servings} porsjoner)
                        <button style={{ marginLeft: 8 }} onClick={() => hideRecipe(recipe.id)}>
                          Skjul
                        </button>
                      </li>
                  ))}
                </ul>
              </div>
            </>
        )}
      </div>
  );
}