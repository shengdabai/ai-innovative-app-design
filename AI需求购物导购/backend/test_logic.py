import sys
import os

# Add the parent directory to sys.path to allow importing app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.need_analysis import NeedAnalyzer
from app.services.product_service import ProductService

def test_analyzer():
    # Initialize with product service
    product_service = ProductService()
    analyzer = NeedAnalyzer(product_service)
    
    # Test Case 1: General Sleep Issue
    print("\n=== Test Case 1: General Sleep Issue ===")
    test_input = "最近睡眠不好，想买点帮助睡眠的东西"
    result = analyzer.analyze_user_need(test_input)
    print(f"Input: {test_input}")
    print(f"Symptoms: {result['symptoms']}")
    print(f"Products Found: {len(result['products'])}")
    assert "睡眠质量差" in result['symptoms']
    
    # Test Case 2: Budget Constraint
    print("\n=== Test Case 2: Budget Constraint ===")
    test_input = "想要个遮光眼罩，预算100元以内"
    result = analyzer.analyze_user_need(test_input)
    print(f"Input: {test_input}")
    print(f"Detected Budget: {result['detected_budget']}")
    print(f"Products Found: {len(result['products'])}")
    
    # Verify budget logic
    if result['detected_budget']:
        for p in result['products']:
            print(f" - Product: {p['name']}, Price: {p['price']}")
            assert p['price'] <= result['detected_budget']
            
    print("\nAll Tests Passed!")

if __name__ == "__main__":
    test_analyzer()
