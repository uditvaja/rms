const models = require("../models");

const getCounts = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const totalOrderCount = await models.PlacedOrder.countDocuments({
      orderDate: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    const customerCount = await models.Customer.countDocuments();

    const todayRevenue = await models.PlacedOrder.aggregate([
      {
        $match: {
          orderDate: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
          paymentStatus: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalRevenue = todayRevenue.length > 0 ? todayRevenue[0].totalRevenue : 0;

    const todayOrders = await models.PlacedOrder.find({
      orderDate: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    const totalWaitingTime = todayOrders.reduce((acc, order) => {
      if (order.makingTime) {
        const [hours, minutes] = order.makingTime.split(':').map(Number);
        return acc + (hours * 60 + minutes);
      }
      return acc;
    }, 0);

    const averageWaitingTimeInMinutes = totalOrderCount > 0 ? totalWaitingTime / totalOrderCount : 0;

    // Convert average waiting time to HH:MM format
    const averageHours = String(Math.floor(averageWaitingTimeInMinutes / 60)).padStart(2, '0');
    const averageMinutes = String(Math.round(averageWaitingTimeInMinutes % 60)).padStart(2, '0');
    const averageWaitingTime = `${averageHours}:${averageMinutes}`;

    res.status(200).json({
      totalOrders: totalOrderCount,
      totalCustomers: customerCount,
      totalRevenue,
      averageWaitingTime,
    });

  } catch (error) {
    console.error("Error fetching counts:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


const countOrdersByType = async (req, res) => {
  try {
    const year = new Date().getUTCFullYear();
    const startDate = new Date(Date.UTC(year, 0, 1)); // January 1st, UTC
    const endDate = new Date(Date.UTC(year + 1, 0, 1)); // January 1st of the next year, UTC

    const aggregateCounts = async (orderType) => {
      return await models.PlacedOrder.aggregate([
        { $match: { orderType, orderDate: { $gte: startDate, $lt: endDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
    };

    const [parcelCounts, onsiteCounts] = await Promise.all([
      aggregateCounts("Parcel"),
      aggregateCounts("Onsite"),
    ]);

    res.status(200).json({
      year,
      parcelCounts,
      onsiteCounts,
    });
  } catch (error) {
    console.error("Error counting orders:", error);
    res.status(500).json({
      message: "Error counting orders",
      error: error.message,
    });
  }
};

const customerVisit = async (req, res) => {
  try {
    const counts = await models.Customer.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json(counts);
  } catch (error) {
    console.error("Error counting customers by date:", error);
    res.status(500).json({
      message: "Error counting customers by date",
      error: error.message,
    });
  }
};

const getPopularDishes = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1));

    const financialYearStartMonth = 3; // Assuming financial year starts in April
    const currentFinancialYearStart = new Date(
      Date.UTC(
        today.getUTCMonth() >= financialYearStartMonth ? today.getUTCFullYear() : today.getUTCFullYear() - 1,
        financialYearStartMonth,
        1
      )
    );

    // Fetch all records from today and past data
    const allRecords = await models.PlacedOrder.aggregate([
      {
        $match: {
          orderDate: {
            $gte: currentFinancialYearStart,
            $lt: endOfDay, // up to today
          },
          paymentStatus: "completed",
        },
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "products",
          localField: "items.itemId",
          foreignField: "_id",
          as: "itemDetails",
        },
      },
      {
        $unwind: "$itemDetails",
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
            dishId: "$items.itemId",
            dishName: "$itemDetails.itemName",
            dishImage: "$itemDetails.imageUrl",
            price: "$items.totalPrice",
          },
          totalOrders: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.totalPrice", "$items.quantity"] } },
        },
      },
      {
        $sort: { "_id.date": -1, totalOrders: -1 }, // Sort by date and most popular dish
      },
      {
        $group: {
          _id: "$_id.date",
          topDish: { $first: "$$ROOT" }, // Get the most popular dish per date
        },
      },
      {
        $replaceRoot: { newRoot: "$topDish" }, // Replace with top dish data
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          dishId: "$_id.dishId",
          price: "$_id.price",
          dishName: "$_id.dishName",
          dishImage: "$_id.dishImage",
          totalOrders: 1,
          totalRevenue: 1,
        },
      },
    ]);

    res.status(200).json(allRecords);
  } catch (error) {
    console.error("Error fetching popular dishes:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = { getCounts, countOrdersByType, customerVisit, getPopularDishes };