from typing import List, Dict, Any, Optional
import os
# In a real scenario with API key, we would import langchain classes
# from langchain.chat_models import ChatOpenAI
# from langchain.prompts import ChatPromptTemplate

class NeedAnalyzer:
    """
    Service for analyzing user needs based on the "Chain of Thought" approach.
    Now supports product mapping.
    """
    
    def __init__(self, product_service=None):
        self.product_service = product_service

    def analyze_user_need(self, user_input: str) -> Dict[str, Any]:
        """
        Main entry point for need analysis workflow.
        """
        # Step 1: Extract Symptoms & Constraints
        extraction_result = self._extract_info(user_input)
        symptoms = extraction_result['symptoms']
        budget = extraction_result.get('budget_max')
        
        # Step 2: Diagnose Problem Type
        problem_type = self._classify_problem(symptoms)
        
        # Step 3: Generate Solutions
        solutions = self._generate_solutions(problem_type)
        
        # Step 4: Map to Product Categories
        categories = self._map_to_categories(solutions)
        
        # Step 5: Retrieve Products
        products = []
        if self.product_service:
            products = self.product_service.search_products(categories, max_price=budget)

        return {
            'symptoms': symptoms,
            'problem_type': problem_type,
            'solutions': solutions,
            'categories': categories,
            'products': products,
            'original_input': user_input,
            'detected_budget': budget
        }

    def _extract_info(self, text: str) -> Dict[str, Any]:
        """
        Simulate extraction of symptoms and constraints (budget).
        """
        info = {'symptoms': [], 'budget_max': None}
        
        # 1. Extract Symptoms
        text_lower = text.lower()
        if "睡眠" in text_lower or "睡" in text_lower or "sleep" in text_lower:
            info['symptoms'].extend(["睡眠质量差", "难入睡"])
        if "吵" in text_lower or "噪音" in text_lower or "声音" in text_lower:
            info['symptoms'].append("环境噪音干扰")
        if "光" in text_lower or "亮" in text_lower:
            info['symptoms'].append("光线干扰")
        if "痛" in text_lower or "腰" in text_lower or "颈" in text_lower:
            info['symptoms'].append("身体疼痛")
        
        if not info['symptoms']:
            info['symptoms'].append("潜在改善需求")

        # 2. Extract Budget (Simple Regex for demo)
        import re
        # Match patterns like "200元以内", "预算300", "低于500"
        budget_match = re.search(r'(?:预算|低于|以内)(\d+)', text)
        if budget_match:
            try:
                info['budget_max'] = float(budget_match.group(1))
            except ValueError:
                pass
        
        # Match patterns like "100-300元" -> take max
        range_match = re.search(r'(\d+)-(\d+)元', text)
        if range_match:
            try:
                info['budget_max'] = float(range_match.group(2))
            except ValueError:
                pass

        return info

    def _classify_problem(self, symptoms: List[str]) -> str:
        if any(s in ["睡眠质量差", "难入睡", "环境噪音干扰", "光线干扰"] for s in symptoms):
            return "sleep_quality_issue"
        if "身体疼痛" in symptoms:
            return "ergonomics_issue"
        return "general_shopping_need"

    def _generate_solutions(self, problem_type: str) -> List[str]:
        if problem_type == "sleep_quality_issue":
            return ["改善睡眠环境(光线/噪音)", "提升寝具舒适度", "放松助眠"]
        if problem_type == "ergonomics_issue":
            return ["人体工学支撑", "姿态矫正"]
        return ["一般商品推荐"]

    def _map_to_categories(self, solutions: List[str]) -> List[str]:
        categories = []
        for sol in solutions:
            if "改善睡眠环境" in sol:
                categories.extend(["遮光眼罩", "白噪音机", "遮光窗帘"])
            if "提升寝具舒适度" in sol:
                categories.extend(["记忆棉枕头", "乳胶床垫"])
            if "人体工学" in sol:
                categories.extend(["人体工学椅", "腰靠"])
        return list(set(categories))
