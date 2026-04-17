import json
import os
from typing import List, Dict, Any

class ProductService:
    def __init__(self, data_path: str = "data/products.json"):
        # Get absolute path relative to this file if relative path is provided
        if not os.path.isabs(data_path):
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            self.data_path = os.path.join(base_dir, data_path)
        else:
            self.data_path = data_path
            
        self.products = self._load_data()

    def _load_data(self) -> List[Dict[str, Any]]:
        try:
            with open(self.data_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: Product data file not found at {self.data_path}")
            return []
        except json.JSONDecodeError:
            print(f"Error: Failed to decode JSON from {self.data_path}")
            return []

    def search_products(self, categories: List[str], max_price: float = None, limit: int = 3) -> List[Dict[str, Any]]:
        """
        Search products that match any of the given categories.
        Supports price filtering.
        """
        results = []
        for product in self.products:
            # 1. Check Category
            if product.get("category") in categories:
                # 2. Check Price (if max_price is provided)
                if max_price is not None:
                    if product.get("price", 0) > max_price:
                        continue
                
                results.append(product)
        
        # In a real app, we would rank them. For now, just return first N matches.
        return results[:limit]

    def get_product_by_id(self, product_id: str) -> Dict[str, Any]:
        for product in self.products:
            if product.get("id") == product_id:
                return product
        return None
