"use client";
import React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { ChevronLeft, Minus, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useUser } from "../UserContext";

export default function ItemDetails() {
  const [quantity, setQuantity] = useState(1);
  const [isVeg, setIsVeg] = useState(true);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { id } = useParams();
  const { user, setUser } = useUser();
  const userid = localStorage.getItem("userId");

  // Function to check if the URL is absolute
  const isAbsoluteUrl = (url) => {
    return url.startsWith("http://") || url.startsWith("https://");
  };

  // Fetch item details
  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/product/items/${id}`
        );
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setItem(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItemDetails();
  }, [id]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No token found. Please login.");
          return;
        }
        const response = await axios.get(
          "http://localhost:8080/api/customer/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUser(response.data);
      } catch (error) {
        setError("Error fetching user data");
        console.error(error);
      }
    };
    fetchUserData();
  }, []);

  // Handle option selection in customization
  const handleOptionSelect = (step, option) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [step]: option,
    }));
  };

  // Calculate total price dynamically
  const totalPrice = item ? item.price * quantity : 0;

  // Handle add to cart
  const handleAddToCart = async () => {
    const customizations = Object.values(selectedOptions);
  
    const cartData = {
      userId: userid,
      items: [
        {
          itemId: item._id,
          item: item.itemName,
          quantity, // Pass quantity separately
          totalPrice: item.price, // Use the price of a single item
          customizations: customizations.map((option) => ({
            title: option.name,
            option: option.detail,
            extraRate: option.extraRate,
          })),
        },
      ],
    };
    console.log("cart", cartData);
  
    try {
      const response = await axios.post(
        "http://localhost:8080/api/place-order/",
        cartData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 201) {
        console.log("Order placed successfully:", response.data.order);
        navigate("/cartpage", { state: { order: response.data.order } });
      } else {
        const error = await response.json();
        console.error("Error placing order:", error);
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };
  // Handle loading and error states
  if (loading) return <p>Loading item details...</p>;
  if (error)
    return <p className="text-red-500">Failed to load item details: {error}</p>;
  if (!item) return <p className="text-gray-500">No item details available.</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-white w-[375px] mx-auto relative">
      {/* Header */}
      <div className="flex items-center p-4 bg-gray-800">
        <ChevronLeft className="w-6 h-6" onClick={() => navigate(-1)} />
        <h1 className="text-lg font-semibold mx-auto">Item Details</h1>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center p-4">
        <div className="text-center">
          <img
            src={
              isAbsoluteUrl(item.imageUrl)
                ? item.imageUrl
                : `http://localhost:8080/${item.imageUrl}`
            }
            alt={item.itemName}
            className="w-full h-full mt-6 mb-10"
          />
        </div>

        <div className="bg-[#1F1D2B] w-[375px] rounded-t-xl p-6 relative">
          {/* Veg/Non-Veg Toggle and Customization */}
          <div className="w-full flex items-center justify-between mb-3 absolute -top-4 z-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsCustomizationOpen(true)}
                className="px-4 py-2 text-sm bg-white/30 rounded-full hover:bg-gray-700"
              >
                Customization
              </button>
              <button
                className={`relative border-dotted border-2 rounded-full p-3 ${
                  item.itemType === "veg"
                    ? "border-green-500"
                    : "border-red-500"
                }`}
              >
                <span
                  className={`absolute bottom-3 right-3 transform translate-x-1/2 translate-y-1/2 w-[15px] h-[15px] rounded-full ${
                    item.itemType === "veg" ? "bg-green-500" : "bg-red-500"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 border-b pb-2 border-[#333748] mt-6">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold mb-2">{item.itemName}</h2>
              <span className="text-xl font-semibold text-[#CA923D]">
                ₹ {totalPrice}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="w-8 h-8 flex items-center justify-center bg-[#CA923D] rounded-full text-white hover:bg-yellow-700"
                onClick={(e) => {
                  e.preventDefault();
                  setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
                }}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center text-base font-semibold">
                {quantity.toString().padStart(2, "0")}
              </span>
              <button
                className="w-8 h-8 flex items-center justify-center bg-[#CA923D] rounded-full text-white hover:bg-yellow-700"
                onClick={(e) => {
                  e.preventDefault();
                  setQuantity((prev) => prev + 1);
                }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <h3 className="font-semibold mb-1 mt-4 text-base">Details</h3>
          <p className="text-xs text-gray-400">
            {item.spiceLevel}, {item.ingredients}
          </p>
          <h3 className="font-semibold mb-1 mt-4 text-base">Ingredients</h3>
          <ul className="text-xs text-gray-400 list-disc list-inside">
            {item.ingredients.split(",").map((ingredient, index) => (
              <li key={index}>{ingredient.trim()}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Add to Cart Button */}
      <div className="fixed w-[375px] bottom-0 left-1/2 transform -translate-x-1/2 p-4 bg-gray-800">
        <button
          className="w-full py-3 text-sm font-medium rounded-lg bg-[#CA923D] hover:bg-yellow-700"
          onClick={handleAddToCart}
        >
          Add To Cart
        </button>
      </div>

      {/* Customization Dialog */}
      {isCustomizationOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center">
          <div className="bg-gray-900 w-[375px] rounded-t-xl p-6">
            <h2 className="text-lg font-semibold mb-2 border-b pb-2 border-[#333748]">
              Customise as per your taste 
            </h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-base">
                    {item.customizations[currentStep - 1]?.title}
                  </h3>
                  <span className="text-sm text-gray-400">
                    Step {currentStep}/{item.customizations.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {item.customizations[currentStep - 1]?.options.map(
                    (option) => (
                      <label
                        key={option.name}
                        className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer border border-gray-700"
                      >
                        <span className="text-sm">{option.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm">₹ {option.extraRate}</span>
                          <input
                            type="radio"
                            name={`option-${currentStep}`}
                            checked={
                              selectedOptions[currentStep]?.name === option.name
                            }
                            onChange={() =>
                              handleOptionSelect(currentStep, option)
                            }
                            className="w-4 h-4 accent-yellow-600"
                          />
                        </div>
                      </label>
                    )
                  )}
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() =>
                    setCurrentStep((prev) => (prev > 1 ? prev - 1 : 1))
                  }
                  className="flex-1 py-3 text-sm font-medium bg-gray-800 rounded-lg hover:bg-gray-700"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (currentStep < item.customizations.length) {
                      setCurrentStep((prev) => prev + 1);
                    } else {
                      setIsCustomizationOpen(false);
                    }
                  }}
                  className="flex-1 py-3 bg-yellow-600 rounded-lg text-sm font-medium hover:bg-yellow-700"
                >
                  {currentStep === item.customizations.length
                    ? "Add to Cart"
                    : "Continue"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}