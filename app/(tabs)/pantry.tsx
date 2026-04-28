import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { deleteItem, updateItemField } from "../../scripts/firebaseHelpers";

import DateTimePicker from "@react-native-community/datetimepicker";
//For firebase:
import { db } from "@/firebase";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

type ExpiryStatus = "fresh" | "soon" | "expired";

type PantryItem = {
  id: string;
  name: string;
  category: string;
  daysLeft: number;
  status: ExpiryStatus;
  expDate?: Date;
  ingredients: string[];
  image: string;
};

const FILTERS = ["All", "add", "fridge", "pantry"] as const;
type FilterType = (typeof FILTERS)[number];

//This represents the color of the items as they get closer to EXPDATE
const getStatusColor = (status: ExpiryStatus) => {
  switch (status) {
    case "fresh":
      return "#37d61d";
    case "soon":
      return "#e0b400";
    case "expired":
      return "#c84b49";
    default:
      return "#cfcfcf";
  }
};

//THIS IS WHAT POPULATES THE PANTRY PAGE ---------------------------------------------
const ItemCard = ({
  item,
  onPress,
}: {
  item: PantryItem;
  onPress: (item: PantryItem) => void;
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(item)}
      style={styles.card}
    >
      <View style={styles.cardImageArea}>
        <Image
          source={{ uri: item.image }}
          style={{ width: "100%", height: "100%" }}
        />
      </View>
      <View
        style={[
          styles.cardLabelArea,
          { backgroundColor: getStatusColor(item.status) },
        ]}
      >
        <Text numberOfLines={1} style={styles.cardLabelText}>
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

//THIS PART handles the popup when the item is clicked---------------------------------
const ItemDetailModal = ({
  item,
  visible,
  slideAnim,
  onClose,
  onDelete,
  onEdit,
}: {
  item: PantryItem | null;
  visible: boolean;
  slideAnim: Animated.Value;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}) => {
  if (!visible || !item) return null;

  return (
    <View style={styles.modalRoot} pointerEvents="box-none">
      <Pressable style={styles.overlayPressable} onPress={onClose}>
        <View style={styles.overlayBlur}>
          <Text style={styles.overlayText}>click this area to exit</Text>
        </View>
      </Pressable>

      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.sheetHandle} />
        <View style={styles.sheetTopRow}>
          <View style={styles.sheetImagePlaceholder}>
            <Image
              source={{ uri: item.image }}
              style={{ width: "100%", height: "100%" }}
            />
          </View>
          <View style={styles.sheetTextColumn}>
            <Text style={styles.sheetItemName}>{item.name}</Text>
            <View style={styles.expContainView}>
              <Text style={styles.sheetDateText}>
                exp date:{" "}
                {item.expDate ? item.expDate.toLocaleDateString() : "null"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  onEdit(item.id);
                }}
              >
                <Ionicons name="create-outline" size={20} color="#111" />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={styles.trashButton}
            onPress={() => {
              onDelete(item.id);
              onClose();
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#111" />
          </TouchableOpacity>
        </View>
        <Text style={styles.ingredientsHeader}>ingredients list:</Text>
        <ScrollView style={styles.ingredientsContainer}>
          {item.ingredients.map((ingredient, index) => {
            return (
              <View key={index} style={styles.ingredientRow}>
                <Text style={styles.sheetInfoText}>
                  {item.ingredients[index]}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

//MAIN PAGE DEFINITION -----------------------------------------------------------------------

export default function PantryScreen() {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("All");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<PantryItem | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(320)).current;
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const [selectedbarcode, setSelectedBarcode] = useState("");

  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [removedItem, SetRemovedItem] = useState<PantryItem[]>([]);

  const pantryItemsData: PantryItem[] = items;

  //This is used to filter the items by the Search bar and by the individual filters -----------------

  const filteredPantryItems = useMemo(() => {
    return pantryItemsData.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesFilter =
        selectedFilter === "All" ||
        item.category.toLowerCase() === selectedFilter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [items, search, date, selectedFilter]);

  //This is what we use to check whether the items are expired, close to expiration or fresh
  const checkDate = (date: Date) => {
    const thisDate = new Date();

    //One day in milliseconds
    const oneDay = 1000 * 60 * 60 * 24;
    const diffTime = date.getTime() - thisDate.getTime(); //Returns milliseconds since 1970

    const diffInDays = Math.round(diffTime / oneDay);

    if (diffInDays < 0) {
      return "expired";
    } else if (diffInDays < 8) {
      return "soon";
    } else {
      return "fresh";
    }
  };

  const delUpdate = async (barcode: string) => {
    setItems((prev) => prev.filter((item) => item.id !== barcode));

    try {
      await deleteItem(`inventory`, barcode);
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const updateDate = async (barcode: string, newDate: Date) => {
    console.log("inventory " + barcode + " expdate " + newDate);
    await updateItemField(`inventory`, barcode, `expDate`, newDate);
  };
  //This is the hook we use to obtain the information from the firestore database-------------------
  useEffect(() => {
    async function fetchItems() {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        const date = new Date();

        if (!user) {
          console.log("USer not logged in");
          return;
        }
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const raw = userData.inventory || {};

          const data: PantryItem[] = Object.entries(raw).map(
            ([id, item]: [string, any]) => ({
              id,
              name: item.productName || "Unnamed",
              category: item.category || "pantry",
              daysLeft: item.daysLeft || 0,
              status: checkDate(item.expDate?.toDate?.()),
              expDate: item.expDate?.toDate?.() || "",
              ingredients: item.ingredients || [],
              image: item.image || "",
              allergies: item.allergies || [],
            }),
          );

          // console.log("inventory array:", data);
          setItems(data);
        }
      } catch (error) {
        console.log("Error fetching pantry items:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchItems();
  }, [date]);
  if (loading) {
    return <ActivityIndicator />;
  }

  // The "openDetail" and "closeDetail" handle the animation behavior of the "ItemDetailModal" pop-up------------
  const openDetail = (item: PantryItem) => {
    setSelectedItem(item);
    setIsDetailVisible(true);
    slideAnim.setValue(320);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };
  const closeDetail = () => {
    Animated.timing(slideAnim, {
      toValue: 320,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsDetailVisible(false);
        setSelectedItem(null);
      }
    });
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/*Start of the Pantrry Page top section
            ================================================================*/}
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>My pantry</Text>

              <View style={styles.headerIcons}>
                <TouchableOpacity
                  onPress={() => router.navigate("/expirationWarningPage")}
                  style={styles.warningsButton}
                >
                  <Text style={styles.warningText}>
                    {"("}6{")"} items!
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="person-outline" size={22} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.navigate("/wishlist")}
                  style={styles.iconButton}
                >
                  <Ionicons name="basket-outline" size={22} color="#111" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.searchRow}>
              <View style={styles.searchBar}>
                <TextInput
                  placeholder="search pantry..."
                  placeholderTextColor="#777"
                  value={search}
                  onChangeText={setSearch}
                  style={styles.searchInput}
                />
              </View>
              <TouchableOpacity style={styles.searchIconButton}>
                <Ionicons name="search" size={20} color="#111" />
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                is24Hour={true}
                onChange={(event, selectedDate) => {
                  if (event.type === "set" && selectedDate) {
                    setDate(selectedDate);
                    updateDate(selectedbarcode, selectedDate);
                  }

                  setShowDatePicker(false); // closes only picker popup
                }}
              />
            )}
            {/*===============================================================
            END of the Pantrry Page top section
            ================================================================*/}

            {/* EXPIRING SOON SECTION ================================================= */}
            <Text style={styles.sectionTitle}>Expiring soon</Text>
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalListContent}
            >
              {filteredPantryItems.map((item) =>
                item.expDate &&
                (item.status == "expired" || item.status == "soon") ? (
                  <View key={item.id} style={styles.horizontalCardWrapper}>
                    <ItemCard item={item} onPress={openDetail} />
                  </View>
                ) : null,
              )}
            </ScrollView>

            {/* FILTERS SECTION ================================================= */}
            <View style={styles.filterRow}>
              {FILTERS.map((filter) => {
                const isSelected = selectedFilter === filter;
                return (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.filterChip,
                      isSelected && styles.filterChipSelected,
                    ]}
                    onPress={() => setSelectedFilter(filter)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isSelected && styles.filterChipTextSelected,
                      ]}
                    >
                      {filter}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.divider} />

            {/* ITEMS SECTION ================================================= */}
            <View style={styles.gridContent}>
              {filteredPantryItems.map((item, index) => {
                const isLeft = index % 2 === 0;
                const isLastOdd =
                  index === filteredPantryItems.length - 1 &&
                  filteredPantryItems.length % 2 !== 0;

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.gridItemWrapper,
                      isLeft ? styles.gridItemLeft : styles.gridItemRight,
                      isLastOdd && styles.gridItemFullWidth,
                    ]}
                  >
                    <ItemCard item={item} onPress={openDetail} />
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
        <ItemDetailModal
          item={selectedItem}
          visible={isDetailVisible}
          slideAnim={slideAnim}
          onClose={closeDetail}
          onDelete={delUpdate}
          onEdit={(id) => {
            setShowDatePicker(true);
            setSelectedBarcode(id);
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  container: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 29,
    fontWeight: "500",
    color: "#111",
  },

  warningsButton: {
    backgroundColor: "#FE6C6C",
    borderRadius: 20,
    padding: 5,
  },

  warningText: {
    color: "white",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: 10,
    padding: 2,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    backgroundColor: "#e5e5e5",
    borderRadius: 20,
    height: 38,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  searchInput: {
    fontSize: 14,
    color: "#111",
  },
  searchIconButton: {
    marginLeft: 8,
    padding: 4,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ef1e1e",
    marginBottom: 10,
  },
  horizontalListContent: {
    paddingRight: 8,
    paddingBottom: 10,
  },
  horizontalCardWrapper: {
    width: 106,
    marginRight: 12,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 8,
  },
  filterChip: {
    backgroundColor: "#e4e4e4",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
    minWidth: 48,
    alignItems: "center",
  },
  filterChipSelected: {
    backgroundColor: "#000000",
  },
  filterChipText: {
    color: "#767676",
    fontSize: 13,
    fontWeight: "500",
    textTransform: "lowercase",
  },
  filterChipTextSelected: {
    color: "#ffffff",
  },
  divider: {
    height: 1,
    backgroundColor: "#d7d7d7",
    marginBottom: 12,
  },
  gridContent: {
    width: "95%",
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 12,
  },
  gridItemWrapper: {
    width: "48%",
    marginBottom: 12,
  },
  gridItemLeft: {
    marginRight: "4%",
  },
  gridItemRight: {
    marginRight: 0,
  },
  gridItemFullWidth: {
    width: "48%",
  },
  modalRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 50,
  },
  overlayPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayBlur: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.72)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  overlayText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111",
    textAlign: "center",
    marginBottom: 250,
  },
  bottomSheet: {
    backgroundColor: "#52f04f",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    minHeight: 400,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 28,
  },
  sheetHandle: {
    width: 116,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#000",
    alignSelf: "center",
    marginBottom: 18,
  },
  sheetTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  sheetImagePlaceholder: {
    width: 78,
    height: 92,
    borderRadius: 14,
    backgroundColor: "#e4e4e4",
    marginRight: 10,
  },
  sheetTextColumn: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 30,
  },
  sheetItemName: {
    fontSize: 22,
    color: "#111",
    marginBottom: 6,
    textTransform: "lowercase",
  },
  sheetDateText: {
    fontSize: 20,
    color: "#111",
    textTransform: "lowercase",
  },
  trashButton: {
    paddingLeft: 10,
    paddingTop: 10,
  },
  sheetInfoText: {
    marginTop: 18,
    fontSize: 19,
    color: "#111",
    textTransform: "lowercase",
  },

  expContainView: {
    // backgroundColor: "red",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 40,
  },
  ingredientsContainer: {
    backgroundColor: "white",
    marginTop: 10,
    height: 200,
    overflowY: "scroll",
  },

  ingredientsHeader: {
    fontSize: 20,
    marginTop: 10,
  },
  ingredientRow: {
    borderColor: "black",
    borderWidth: 1,
    paddingLeft: 5,
  },

  card: {
    width: "100%",
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
  },
  cardImageArea: {
    height: 92,
    backgroundColor: "#d9d9d9",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    color: "#9a9a9a",
    fontSize: 12,
  },
  cardLabelArea: {
    minHeight: 28,
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  cardLabelText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "lowercase",
  },
});
