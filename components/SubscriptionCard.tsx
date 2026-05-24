import { icons } from "@/constants/icons";
import { formatCurrency, formatStatusLabel, formatSubscriptionDateTime } from "@/lib/utils";
import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";

const SubscriptionCard = ({
  name,
  price,
  currency,
  icon,
  billing,
  color,
  category,
  plan,
  renewalDate,
  expanded,
  paymentMethod,
  startDate,
  status,
  onPress,
  onCancelPress,
}: SubscriptionCardProps) => {
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [icon]);

  return (
    <Pressable onPress={onPress}

      className={clsx("sub-card", expanded ? "sub-card-expanded" : !color && "bg-card")}
      style={!expanded && color ? { backgroundColor: color } : undefined}
    >
      <View className="sub-head">
        <View className="sub-main">
          <Image
            source={imgError ? icons.wallet : icon}
            className="sub-icon"
            onError={() => setImgError(true)}
          />
          <View className="sub-copy">
            <Text numberOfLines={1} className="sub-title">
              {name}
            </Text>
            <Text numberOfLines={1} ellipsizeMode="tail" className="sub-meta">
              {category?.trim() ||
                plan?.trim() ||
                (renewalDate ? formatSubscriptionDateTime(renewalDate) : "")}
            </Text>
          </View>
        </View>
        <View className="sub-price-box">
          <Text className="sub-price">{formatCurrency(price, currency)}</Text>
          <Text className="sub-billing">{billing}</Text>
        </View>
      </View>
    
    {expanded && (
        <View className="sub-bdy">
            <View className="sub-details">
                <View className="sub-row">
                    <View className="sub-row-copy">
                        <Text className="sub-label">
                            Payment:
                        </Text>
                        <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                            {paymentMethod ?. trim()}
                        </Text>
                    </View>
                </View>
                 <View className="sub-row">
                    <View className="sub-row-copy">
                        <Text className="sub-label">
                            Category
                        </Text>
                        <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                            {category ?. trim() || plan ?. trim ()}
                        </Text>
                    </View>
                </View>
                 <View className="sub-row">
                    <View className="sub-row-copy">
                        <Text className="sub-label">
                            Started:
                        </Text>
                        <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                            {startDate ? formatSubscriptionDateTime(startDate) : ''}
                        </Text>
                    </View>
                </View>
                <View className="sub-row">
                    <View className="sub-row-copy">
                        <Text className="sub-label">
                            Renewal date:
                        </Text>
                        <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                            {renewalDate ? formatSubscriptionDateTime(renewalDate) : ''}
                        </Text>
                    </View>
                </View>
                <View className="sub-row">
                    <View className="sub-row-copy">
                        <Text className="sub-label">
                            Status:
                        </Text>
                        <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                            {status ? formatStatusLabel(status) : ''}
                        </Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity
              className="sub-cancel"
              onPress={onCancelPress}
              activeOpacity={0.8}
            >
              <Text className="sub-cancel-text">Delete Subscription</Text>
            </TouchableOpacity>
        </View>
    )}

    </Pressable>
  );
};

export default SubscriptionCard;
